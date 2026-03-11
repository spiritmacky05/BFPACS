package checkin

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// Handler handles NFC and PIN-based check-in endpoints
type Handler struct {
	Repo *CheckInRepo
}

func NewHandler(repo *CheckInRepo) *Handler {
	return &Handler{Repo: repo}
}

// NFCCheckIn handles POST /api/v1/checkin/nfc
// Looks up the personnel by nfc_tag_id, then atomically checks for duplicate and logs the check-in.
func (h *Handler) NFCCheckIn(c *gin.Context) {
	var req models.NFCCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Step 1: Find personnel by NFC tag ID (indexed lookup)
	personnel, err := h.Repo.GetPersonnelByNFCTag(ctx, req.NFCTagID)
	if err != nil {
		log.Printf("[CheckIn.NFCCheckIn] GetPersonnelByNFCTag: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to look up NFC tag"})
		return
	}
	if personnel == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "NFC tag not registered to any personnel"})
		return
	}

	// Step 2: Atomically check for duplicate and create check-in (prevents TOCTOU race)
	checkinLog, err := h.Repo.CheckInAtomic(ctx, personnel.ID, req.IncidentID, "NFC")
	if err != nil {
		if errors.Is(err, ErrAlreadyCheckedIn) {
			c.JSON(http.StatusConflict, gin.H{
				"error":     "Personnel is already checked in to this incident",
				"personnel": personnel,
			})
			return
		}
		log.Printf("[CheckIn.NFCCheckIn] CheckInAtomic: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record check-in"})
		return
	}

	c.JSON(http.StatusCreated, models.CheckInResponse{
		Log:       *checkinLog,
		Personnel: *personnel,
		Message:   "Check-in successful via NFC",
	})
}

// PINCheckIn handles POST /api/v1/checkin/pin
func (h *Handler) PINCheckIn(c *gin.Context) {
	var req models.PINCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	personnel, err := h.Repo.GetPersonnelByPIN(ctx, req.PinCode)
	if err != nil {
		log.Printf("[CheckIn.PINCheckIn] GetPersonnelByPIN: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to look up PIN"})
		return
	}
	if personnel == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "PIN not registered to any personnel"})
		return
	}

	checkinLog, err := h.Repo.CheckInAtomic(ctx, personnel.ID, req.IncidentID, "PIN")
	if err != nil {
		if errors.Is(err, ErrAlreadyCheckedIn) {
			c.JSON(http.StatusConflict, gin.H{
				"error":     "Personnel is already checked in to this incident",
				"personnel": personnel,
			})
			return
		}
		log.Printf("[CheckIn.PINCheckIn] CheckInAtomic: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record check-in"})
		return
	}

	c.JSON(http.StatusCreated, models.CheckInResponse{
		Log:       *checkinLog,
		Personnel: *personnel,
		Message:   "Check-in successful via PIN",
	})
}

// GetLogsForIncident handles GET /api/v1/checkin/logs
// Optional ?incident_id= filter. Without it, returns all logs (dashboard use).
func (h *Handler) GetLogsForIncident(c *gin.Context) {
	incidentIDStr := c.Query("incident_id")
	if incidentIDStr == "" {
		// No filter — return all logs for dashboard
		list, err := h.Repo.GetAllLogs(c.Request.Context())
		if err != nil {
			log.Printf("[CheckIn.GetAllLogs] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve check-in logs"})
			return
		}
		c.JSON(http.StatusOK, list)
		return
	}
	incidentID, err := uuid.Parse(incidentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid incident_id"})
		return
	}
	list, err := h.Repo.GetLogsForIncident(c.Request.Context(), incidentID)
	if err != nil {
		log.Printf("[CheckIn.GetLogsForIncident] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve check-in logs"})
		return
	}
	c.JSON(http.StatusOK, list)
}

// CheckOut handles POST /api/v1/checkin/:id/checkout
// Sets check_out_time on the given PersonnelIncidentLog entry.
func (h *Handler) CheckOut(c *gin.Context) {
	logID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid log id"})
		return
	}
	if err := h.Repo.CheckOutByID(c.Request.Context(), logID); err != nil {
		log.Printf("[CheckIn.CheckOut] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check out"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "checked out successfully"})
}

// ManualCheckIn handles POST /api/v1/checkin/manual
// Allows admins/superadmins to deploy a responder user directly to an active incident.
func (h *Handler) ManualCheckIn(c *gin.Context) {
	var req models.ManualCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Step 1: Verify responder user exists
	user, err := h.Repo.GetUserByID(ctx, req.UserID)
	if err != nil {
		log.Printf("[CheckIn.ManualCheckIn] GetUserByID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to look up responder"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "responder not found"})
		return
	}

	// Step 2: Atomically check and create check-in (prevents TOCTOU race)
	checkinLog, err := h.Repo.CheckInAtomic(ctx, user.ID, req.IncidentID, "Manual")
	if err != nil {
		if errors.Is(err, ErrAlreadyCheckedIn) {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Responder is already deployed to this incident",
				"user":  user,
			})
			return
		}
		log.Printf("[CheckIn.ManualCheckIn] CheckInAtomic: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record check-in"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"log":     checkinLog,
		"user":    user,
		"message": "Responder successfully deployed to incident",
	})
}

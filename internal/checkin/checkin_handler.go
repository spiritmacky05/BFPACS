package checkin

import (
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
// Looks up the personnel by nfc_tag_id, checks for duplicate, then logs the check-in.
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if personnel == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "NFC tag not registered to any personnel"})
		return
	}

	// Step 2: Prevent duplicate check-in
	alreadyIn, err := h.Repo.IsCheckedIn(ctx, personnel.ID, req.IncidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if alreadyIn {
		c.JSON(http.StatusConflict, gin.H{
			"error":     "Personnel is already checked in to this incident",
			"personnel": personnel,
		})
		return
	}

	// Step 3: Log the check-in
	log, err := h.Repo.CheckIn(ctx, personnel.ID, req.IncidentID, "NFC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.CheckInResponse{
		Log:       *log,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if personnel == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "PIN not registered to any personnel"})
		return
	}

	alreadyIn, err := h.Repo.IsCheckedIn(ctx, personnel.ID, req.IncidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if alreadyIn {
		c.JSON(http.StatusConflict, gin.H{
			"error":     "Personnel is already checked in to this incident",
			"personnel": personnel,
		})
		return
	}

	log, err := h.Repo.CheckIn(ctx, personnel.ID, req.IncidentID, "PIN")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.CheckInResponse{
		Log:       *log,
		Personnel: *personnel,
		Message:   "Check-in successful via PIN",
	})
}

// GetLogsForIncident handles GET /api/v1/checkin/logs?incident_id=
func (h *Handler) GetLogsForIncident(c *gin.Context) {
	incidentID, err := uuid.Parse(c.Query("incident_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid incident_id"})
		return
	}
	list, err := h.Repo.GetLogsForIncident(c.Request.Context(), incidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

// ManualCheckIn handles POST /api/v1/checkin/manual
// Allows admins/superadmins to deploy a personnel member directly to an active incident.
func (h *Handler) ManualCheckIn(c *gin.Context) {
	var req models.ManualCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Step 1: Verify personnel exists
	personnel, err := h.Repo.GetPersonnelByID(ctx, req.PersonnelID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if personnel == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "personnel not found"})
		return
	}

	// Step 2: Prevent duplicate active check-in
	alreadyIn, err := h.Repo.IsCheckedIn(ctx, personnel.ID, req.IncidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if alreadyIn {
		c.JSON(http.StatusConflict, gin.H{
			"error":     "Personnel is already deployed to this incident",
			"personnel": personnel,
		})
		return
	}

	// Step 3: Log the check-in with method "Manual"
	log, err := h.Repo.CheckIn(ctx, personnel.ID, req.IncidentID, "Manual")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.CheckInResponse{
		Log:       *log,
		Personnel: *personnel,
		Message:   "Personnel successfully deployed to incident",
	})
}

package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type DispatchHandler struct {
	Repo *repository.DispatchRepo
}

func NewDispatchHandler(repo *repository.DispatchRepo) *DispatchHandler {
	return &DispatchHandler{Repo: repo}
}

// DispatchResponder creates an En Route dispatch record for a duty-personnel responder
func (h *DispatchHandler) DispatchResponder(c *gin.Context) {
	var req models.DispatchResponderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d, err := h.Repo.DispatchResponder(c.Request.Context(), req)
	if err != nil {
		log.Printf("[DispatchHandler.DispatchResponder] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to dispatch responder"})
		return
	}
	c.JSON(http.StatusCreated, d)
}

// UpdateStatus updates the BFP radio code (e.g. "10-23 Arrived at Scene")
func (h *DispatchHandler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.UpdateDispatchStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate dispatch status against known values used by the frontend
	validStatuses := map[string]bool{
		// Current flow
		"Dispatched": true,
		"En Route":   true,
		"On Scene":   true,
		"Returning":  true,
		"Completed":  true,
		// Legacy BFP radio codes
		"10-70 En Route":         true,
		"10-23 Arrived at Scene": true,
		"10-41 Beginning Tour":   true,
		"10-42 Ending Tour":      true,
		"Controlled":             true,
		"Fire Out":               true,
		"Available":              true,
		"Cancelled":              true,
	}
	if !validStatuses[req.DispatchStatus] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dispatch_status"})
		return
	}

	if err := h.Repo.UpdateStatus(c.Request.Context(), id, req); err != nil {
		log.Printf("[DispatchHandler.UpdateStatus] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update dispatch status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "dispatch status updated"})
}

// GetByIncident lists all dispatches for an incident
func (h *DispatchHandler) GetByIncident(c *gin.Context) {
	incidentID, err := uuid.Parse(c.Query("incident_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid incident_id"})
		return
	}
	list, err := h.Repo.GetByIncident(c.Request.Context(), incidentID)
	if err != nil {
		log.Printf("[DispatchHandler.GetByIncident] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve dispatches"})
		return
	}
	c.JSON(http.StatusOK, list)
}

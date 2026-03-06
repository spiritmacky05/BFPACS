package handlers

import (
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

// DispatchFleet creates an En Route dispatch record
func (h *DispatchHandler) DispatchFleet(c *gin.Context) {
	var req models.DispatchFleetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d, err := h.Repo.DispatchFleet(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
	if err := h.Repo.UpdateStatus(c.Request.Context(), id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

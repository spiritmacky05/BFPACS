package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type IncidentHandler struct {
	Repo *repository.IncidentRepo
}

func NewIncidentHandler(repo *repository.IncidentRepo) *IncidentHandler {
	return &IncidentHandler{Repo: repo}
}

func (h *IncidentHandler) GetAll(c *gin.Context) {
	data, err := h.Repo.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("[IncidentHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve incidents"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *IncidentHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	incident, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[IncidentHandler.GetByID] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve incident"})
		return
	}
	if incident == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "incident not found"})
		return
	}
	c.JSON(http.StatusOK, incident)
}

// Create reports a new fire incident (10-70). The DB trigger auto-notifies commanders.
func (h *IncidentHandler) Create(c *gin.Context) {
	var req models.CreateIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	incident, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[IncidentHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create incident"})
		return
	}
	c.JSON(http.StatusCreated, incident)
}

func (h *IncidentHandler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.UpdateIncidentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userName, _ := c.Get("userName")
	userNameStr, _ := userName.(string)

	if err := h.Repo.UpdateStatus(c.Request.Context(), id, req, userNameStr); err != nil {
		log.Printf("[IncidentHandler.UpdateStatus] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update incident"})
		return
	}
	// When fire is declared out, check out all personnel still checked in via ACS portal
	if req.IncidentStatus != nil && *req.IncidentStatus == "Fire Out" {
		if err := h.Repo.CheckOutAllPersonnel(c.Request.Context(), id); err != nil {
			log.Printf("[IncidentHandler.UpdateStatus] CheckOutAllPersonnel: %v", err)
			// Non-fatal — incident status was already updated
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "incident updated"})
}

func (h *IncidentHandler) GetStatusHistory(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	logs, err := h.Repo.GetStatusHistory(c.Request.Context(), id)
	if err != nil {
		log.Printf("[IncidentHandler.GetStatusHistory] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve status history"})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// Delete removes an incident permanently. Only superadmin should call this.
func (h *IncidentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	if err := h.Repo.Delete(c.Request.Context(), id); err != nil {
		log.Printf("[IncidentHandler.Delete] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete incident"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "incident deleted"})
}

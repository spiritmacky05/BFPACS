package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type FleetHandler struct {
	Repo *repository.FleetRepo
}

func NewFleetHandler(repo *repository.FleetRepo) *FleetHandler {
	return &FleetHandler{Repo: repo}
}

func (h *FleetHandler) GetAll(c *gin.Context) {
	data, err := h.Repo.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("[FleetHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve fleets"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *FleetHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	f, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[FleetHandler.GetByID] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve fleet"})
		return
	}
	if f == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "fleet not found"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func (h *FleetHandler) Create(c *gin.Context) {
	var req models.CreateFleetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	f, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[FleetHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create fleet"})
		return
	}
	c.JSON(http.StatusCreated, f)
}

func (h *FleetHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Only allow certain fields to be updated
	allowed := map[string]bool{"status": true, "current_assignment_status": true}
	updates := make(map[string]interface{})
	for k, v := range body {
		if allowed[k] {
			updates[k] = v
		}
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no valid fields to update"})
		return
	}
	f, err := h.Repo.Update(c.Request.Context(), id, updates)
	if err != nil {
		log.Printf("[FleetHandler.Update] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update fleet"})
		return
	}
	if f == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "fleet not found"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func (h *FleetHandler) UpdateLocation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.UpdateFleetLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Repo.UpdateLocation(c.Request.Context(), id, req.Lat, req.Lng); err != nil {
		log.Printf("[FleetHandler.UpdateLocation] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update location"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "location updated"})
}

func (h *FleetHandler) LogMovement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.LogMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	movementLog, err := h.Repo.LogMovement(c.Request.Context(), id, req)
	if err != nil {
		log.Printf("[FleetHandler.LogMovement] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to log movement"})
		return
	}
	c.JSON(http.StatusCreated, movementLog)
}

func (h *FleetHandler) GetMovementLogs(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	logs, err := h.Repo.GetMovementLogs(c.Request.Context(), id)
	if err != nil {
		log.Printf("[FleetHandler.GetMovementLogs] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve movement logs"})
		return
	}
	c.JSON(http.StatusOK, logs)
}

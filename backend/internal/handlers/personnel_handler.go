package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type PersonnelHandler struct {
	Repo *repository.PersonnelRepo
}

func NewPersonnelHandler(repo *repository.PersonnelRepo) *PersonnelHandler {
	return &PersonnelHandler{Repo: repo}
}

func (h *PersonnelHandler) GetAll(c *gin.Context) {
	// Superadmin sees all personnel; normal users see only their station's personnel
	if isSuperAdmin(c) {
		data, err := h.Repo.GetAll(c.Request.Context())
		if err != nil {
			log.Printf("[PersonnelHandler.GetAll] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve personnel"})
			return
		}
		c.JSON(http.StatusOK, data)
		return
	}

	stationID := getStationID(c)
	if stationID == nil {
		c.JSON(http.StatusOK, []models.DutyPersonnel{})
		return
	}

	data, err := h.Repo.GetByStation(c.Request.Context(), *stationID)
	if err != nil {
		log.Printf("[PersonnelHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve personnel"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *PersonnelHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	p, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[PersonnelHandler.GetByID] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve personnel"})
		return
	}
	if p == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *PersonnelHandler) Create(c *gin.Context) {
	var req models.CreatePersonnelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Non-superadmin users: force station_id to their own station
	if !isSuperAdmin(c) {
		stationID := getStationID(c)
		if stationID == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "your account is not assigned to a station"})
			return
		}
		req.StationID = stationID
	}

	p, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[PersonnelHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create personnel"})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *PersonnelHandler) UpdateDutyStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.UpdateDutyStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate duty status against allowed values
	validStatuses := map[string]bool{
		"On Duty": true, "Off Duty": true, "On Leave": true, "Deployed": true,
	}
	if !validStatuses[req.DutyStatus] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid duty_status, must be one of: On Duty, Off Duty, On Leave, Deployed"})
		return
	}

	if err := h.Repo.UpdateDutyStatus(c.Request.Context(), id, req.DutyStatus); err != nil {
		log.Printf("[PersonnelHandler.UpdateDutyStatus] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update duty status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "duty status updated"})
}

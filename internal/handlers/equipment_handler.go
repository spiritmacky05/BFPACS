package handlers

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type EquipmentHandler struct {
	Repo *repository.EquipmentRepo
}

func NewEquipmentHandler(repo *repository.EquipmentRepo) *EquipmentHandler {
	return &EquipmentHandler{Repo: repo}
}

func (h *EquipmentHandler) GetAll(c *gin.Context) {
	// If station_id query param provided, filter by station
	if stationIDStr := c.Query("station_id"); stationIDStr != "" {
		stationID, err := uuid.Parse(stationIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid station_id"})
			return
		}
		list, err := h.Repo.GetByStation(c.Request.Context(), stationID)
		if err != nil {
			log.Printf("[EquipmentHandler.GetAll] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve equipment"})
			return
		}
		c.JSON(http.StatusOK, list)
		return
	}
	data, err := h.Repo.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("[EquipmentHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve equipment"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *EquipmentHandler) Create(c *gin.Context) {
	var req models.CreateEquipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	e, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[EquipmentHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create equipment"})
		return
	}
	c.JSON(http.StatusCreated, e)
}

func (h *EquipmentHandler) BorrowItem(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.BorrowEquipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Repo.BorrowItem(c.Request.Context(), id, req); err != nil {
		if errors.Is(err, repository.ErrAlreadyBorrowed) {
			c.JSON(http.StatusConflict, gin.H{"error": "equipment is already borrowed"})
			return
		}
		log.Printf("[EquipmentHandler.BorrowItem] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to borrow equipment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "equipment borrowed"})
}

func (h *EquipmentHandler) ReturnItem(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	if err := h.Repo.ReturnItem(c.Request.Context(), id); err != nil {
		if errors.Is(err, repository.ErrNotBorrowed) {
			c.JSON(http.StatusConflict, gin.H{"error": "equipment is not currently borrowed"})
			return
		}
		log.Printf("[EquipmentHandler.ReturnItem] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to return equipment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "equipment returned"})
}

func (h *EquipmentHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.UpdateEquipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Repo.Update(c.Request.Context(), id, req); err != nil {
		log.Printf("[EquipmentHandler.Update] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update equipment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "equipment updated"})
}

func (h *EquipmentHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	if err := h.Repo.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, repository.ErrCannotDeleteBorrowed) {
			c.JSON(http.StatusConflict, gin.H{"error": "cannot delete equipment that is currently borrowed"})
			return
		}
		log.Printf("[EquipmentHandler.Delete] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete equipment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "equipment deleted"})
}

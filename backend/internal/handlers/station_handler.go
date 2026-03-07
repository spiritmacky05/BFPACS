package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type StationHandler struct {
	Repo *repository.StationRepo
}

func NewStationHandler(repo *repository.StationRepo) *StationHandler {
	return &StationHandler{Repo: repo}
}

func (h *StationHandler) GetAll(c *gin.Context) {
	data, err := h.Repo.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("[StationHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve stations"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *StationHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	s, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[StationHandler.GetByID] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve station"})
		return
	}
	if s == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "station not found"})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *StationHandler) Create(c *gin.Context) {
	var req models.CreateStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[StationHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create station"})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func (h *StationHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.CreateStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s, err := h.Repo.Update(c.Request.Context(), id, req)
	if err != nil {
		log.Printf("[StationHandler.Update] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update station"})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *StationHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	if err := h.Repo.Delete(c.Request.Context(), id); err != nil {
		log.Printf("[StationHandler.Delete] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete station"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "station deleted"})
}

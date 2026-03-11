package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type HydrantHandler struct {
	Repo *repository.HydrantRepo
}

func NewHydrantHandler(repo *repository.HydrantRepo) *HydrantHandler {
	return &HydrantHandler{Repo: repo}
}

func (h *HydrantHandler) GetAll(c *gin.Context) {
	// Admin and superadmin see all hydrants
	if isAdminOrSuperAdmin(c) {
		data, err := h.Repo.GetAll(c.Request.Context())
		if err != nil {
			log.Printf("[HydrantHandler.GetAll] %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve hydrants"})
			return
		}
		c.JSON(http.StatusOK, data)
		return
	}

	// Regular users see their station's hydrants + global (admin-added) hydrants
	stationID := getStationID(c)
	if stationID == nil {
		c.JSON(http.StatusOK, []models.Hydrant{})
		return
	}
	data, err := h.Repo.GetByStationOrGlobal(c.Request.Context(), *stationID)
	if err != nil {
		log.Printf("[HydrantHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve hydrants"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HydrantHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	hy, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[HydrantHandler.GetByID] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve hydrant"})
		return
	}
	if hy == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "hydrant not found"})
		return
	}
	c.JSON(http.StatusOK, hy)
}

// GetNearby returns hydrants within a radius (meters) using the Haversine formula
func (h *HydrantHandler) GetNearby(c *gin.Context) {
	latStr := c.Query("lat")
	lngStr := c.Query("lng")
	radiusStr := c.DefaultQuery("radius", "500")

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lat"})
		return
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lng"})
		return
	}
	radius, err := strconv.ParseFloat(radiusStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid radius"})
		return
	}

	list, err := h.Repo.GetNearby(c.Request.Context(), lat, lng, radius)
	if err != nil {
		log.Printf("[HydrantHandler.GetNearby] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve nearby hydrants"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *HydrantHandler) Create(c *gin.Context) {
	var req models.CreateHydrantRequest
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

	hy, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[HydrantHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create hydrant"})
		return
	}
	c.JSON(http.StatusCreated, hy)
}

func (h *HydrantHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.UpdateHydrantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hy, err := h.Repo.Update(c.Request.Context(), id, req)
	if err != nil {
		log.Printf("[HydrantHandler.Update] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update hydrant"})
		return
	}
	if hy == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "hydrant not found"})
		return
	}
	c.JSON(http.StatusOK, hy)
}

func (h *HydrantHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	if err := h.Repo.Delete(c.Request.Context(), id); err != nil {
		log.Printf("[HydrantHandler.Delete] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete hydrant"})
		return
	}
	c.Status(http.StatusNoContent)
}

package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type DeploymentHandler struct {
	Repo *repository.DeploymentRepo
}

func NewDeploymentHandler(repo *repository.DeploymentRepo) *DeploymentHandler {
	return &DeploymentHandler{Repo: repo}
}

func (h *DeploymentHandler) GetAll(c *gin.Context) {
	data, err := h.Repo.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("[DeploymentHandler.GetAll] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve deployments"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *DeploymentHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	d, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[DeploymentHandler.GetByID] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve deployment"})
		return
	}
	if d == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deployment not found"})
		return
	}
	c.JSON(http.StatusOK, d)
}

func (h *DeploymentHandler) Create(c *gin.Context) {
	var req models.CreateDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	d, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[DeploymentHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create deployment"})
		return
	}
	c.JSON(http.StatusCreated, d)
}

func (h *DeploymentHandler) AssignFleet(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	var req models.AssignFleetToDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a, err := h.Repo.AssignFleet(c.Request.Context(), id, req)
	if err != nil {
		log.Printf("[DeploymentHandler.AssignFleet] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign fleet"})
		return
	}
	c.JSON(http.StatusCreated, a)
}

func (h *DeploymentHandler) GetAssignments(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	list, err := h.Repo.GetAssignments(c.Request.Context(), id)
	if err != nil {
		log.Printf("[DeploymentHandler.GetAssignments] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve assignments"})
		return
	}
	c.JSON(http.StatusOK, list)
}

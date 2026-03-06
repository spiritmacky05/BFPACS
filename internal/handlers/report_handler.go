package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type ReportHandler struct {
	Repo *repository.ReportRepo
}

func NewReportHandler(repo *repository.ReportRepo) *ReportHandler {
	return &ReportHandler{Repo: repo}
}

func (h *ReportHandler) Create(c *gin.Context) {
	var req models.CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	r, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		log.Printf("[ReportHandler.Create] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create report"})
		return
	}
	c.JSON(http.StatusCreated, r)
}

func (h *ReportHandler) GetByIncident(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	list, err := h.Repo.GetByIncident(c.Request.Context(), id)
	if err != nil {
		log.Printf("[ReportHandler.GetByIncident] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve reports"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ReportHandler) GetByDeployment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	list, err := h.Repo.GetByDeployment(c.Request.Context(), id)
	if err != nil {
		log.Printf("[ReportHandler.GetByDeployment] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve reports"})
		return
	}
	c.JSON(http.StatusOK, list)
}

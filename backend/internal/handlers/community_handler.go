package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type CommunityHandler struct {
	repo *repository.CommunityRepo
}

func NewCommunityHandler(repo *repository.CommunityRepo) *CommunityHandler {
	return &CommunityHandler{repo: repo}
}

func (h *CommunityHandler) Register(c *gin.Context) {
	var req models.RegisterCommunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}

	entry, err := h.repo.CreateCommunity(c.Request.Context(), req.FullName, strings.ToLower(req.Email), string(hashedPassword), req.ContactNo)
	if err != nil {
		log.Printf("[CommunityHandler.Register] %v", err)
		c.JSON(http.StatusConflict, gin.H{"error": "email might already be in use"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Community registration successful.",
		"user": gin.H{
			"id":        entry.ID,
			"full_name": entry.FullName,
			"email":     entry.Email,
			"role":      "community",
		},
	})
}

func (h *CommunityHandler) Login(c *gin.Context) {
	var req models.LoginCommunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.repo.GetByEmail(c.Request.Context(), strings.ToLower(req.Email))
	if err != nil || entry == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(entry.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if !entry.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "community account is inactive"})
		return
	}

	tokenStr, err := GenerateJWT(entry.ID, entry.FullName, "community", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenStr,
		"user": gin.H{
			"id":         entry.ID,
			"full_name":  entry.FullName,
			"email":      entry.Email,
			"contact_no": entry.ContactNo,
			"role":       "community",
		},
	})
}

func (h *CommunityHandler) CreateReport(c *gin.Context) {
	if getRole(c) != "community" {
		c.JSON(http.StatusForbidden, gin.H{"error": "community access required"})
		return
	}

	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token context"})
		return
	}

	userIDStr, ok := userIDRaw.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token context"})
		return
	}

	communityID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid community id"})
		return
	}

	community, err := h.repo.GetByID(c.Request.Context(), communityID)
	if err != nil || community == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "community account not found"})
		return
	}

	var req models.CreateCommunityIncidentReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, incident, err := h.repo.CreateIncidentReport(c.Request.Context(), community, req)
	if err != nil {
		log.Printf("[CommunityHandler.CreateReport] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create community report"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "community report submitted",
		"incident": incident,
		"report":   report,
	})
}

func (h *CommunityHandler) ListByIncident(c *gin.Context) {
	incidentID, err := uuid.Parse(c.Query("incident_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid incident_id"})
		return
	}

	list, err := h.repo.ListReportsByIncident(c.Request.Context(), incidentID)
	if err != nil {
		log.Printf("[CommunityHandler.ListByIncident] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch community reports"})
		return
	}

	c.JSON(http.StatusOK, list)
}

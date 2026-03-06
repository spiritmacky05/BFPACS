package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type NotificationHandler struct {
	Repo *repository.NotificationRepo
}

func NewNotificationHandler(repo *repository.NotificationRepo) *NotificationHandler {
	return &NotificationHandler{Repo: repo}
}

func (h *NotificationHandler) GetForUser(c *gin.Context) {
	// Use JWT user ID from context (set by auth middleware) — enforces ownership
	jwtUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found in token"})
		return
	}
	userIDStr, ok := jwtUserID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID in token"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}
	list, err := h.Repo.GetForUser(c.Request.Context(), userID)
	if err != nil {
		log.Printf("[NotificationHandler.GetForUser] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve notifications"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}
	if err := h.Repo.MarkRead(c.Request.Context(), id); err != nil {
		log.Printf("[NotificationHandler.MarkRead] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark notification as read"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "notification marked as read"})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	// Use JWT user ID from context (set by auth middleware) — enforces ownership
	jwtUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found in token"})
		return
	}
	userIDStr, ok := jwtUserID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID in token"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}
	if err := h.Repo.MarkAllRead(c.Request.Context(), userID); err != nil {
		log.Printf("[NotificationHandler.MarkAllRead] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark notifications as read"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

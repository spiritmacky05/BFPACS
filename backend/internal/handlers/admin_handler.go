package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

type AdminHandler struct {
	userRepo *repository.UserRepo
}

func NewAdminHandler(userRepo *repository.UserRepo) *AdminHandler {
	return &AdminHandler{userRepo: userRepo}
}

// GetAllUsers — Admin or SuperAdmin: list every user
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	if !isAdminOrSuperAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	users, err := h.userRepo.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("[AdminHandler.GetAllUsers] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// GetUser — Admin or SuperAdmin: get a single user by ID
func (h *AdminHandler) GetUser(c *gin.Context) {
	if !isAdminOrSuperAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[AdminHandler.GetUser] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// UpdateUser — Admin or SuperAdmin: update user fields.
// Only SuperAdmin can change role and approval status.
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	if !isAdminOrSuperAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Non-superadmin admins cannot change role or approval
	if !isSuperAdmin(c) {
		req.Role = nil
		req.Approved = nil
	}

	// Validate role if provided
	if req.Role != nil {
		validRoles := map[string]bool{"user": true, "admin": true, "superadmin": true}
		if !validRoles[*req.Role] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role, must be one of: user, admin, superadmin"})
			return
		}
	}

	user, err := h.userRepo.UpdateUser(c.Request.Context(), id, req)
	if err != nil {
		log.Printf("[AdminHandler.UpdateUser] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// QuickApprove — SuperAdmin only: toggle the approved status
func (h *AdminHandler) QuickApprove(c *gin.Context) {
	if !isSuperAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "SuperAdmin access required"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
		return
	}

	var body struct {
		Approved bool `json:"approved"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.UpdateUser(c.Request.Context(), id, models.UpdateUserRequest{
		Approved: &body.Approved,
	})
	if err != nil {
		log.Printf("[AdminHandler.QuickApprove] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// GetCurrentUser — returns the currently authenticated user's full profile
func (h *AdminHandler) GetCurrentUser(c *gin.Context) {
	raw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	userIDStr, ok := raw.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user context"})
		return
	}
	id, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("[AdminHandler.GetCurrentUser] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// UpdateCurrentUser — allows authenticated users to update their own profile fields.
// Role and Approved cannot be self-changed.
func (h *AdminHandler) UpdateCurrentUser(c *gin.Context) {
	raw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	userIDStr, ok := raw.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user context"})
		return
	}
	id, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Self-update: users cannot change their own role or approval status
	req.Role = nil
	req.Approved = nil

	user, err := h.userRepo.UpdateUser(c.Request.Context(), id, req)
	if err != nil {
		log.Printf("[AdminHandler.UpdateCurrentUser] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

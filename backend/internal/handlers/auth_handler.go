package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo      *repository.UserRepo
	communityRepo *repository.CommunityRepo
	stationRepo   *repository.StationRepo
}

func NewAuthHandler(repo *repository.UserRepo, communityRepo *repository.CommunityRepo, stationRepo *repository.StationRepo) *AuthHandler {
	return &AuthHandler{
		userRepo:      repo,
		communityRepo: communityRepo,
		stationRepo:   stationRepo,
	}
}

// GenerateJWT creates a new token valid for 24 hours
func GenerateJWT(userID uuid.UUID, fullName string, role string, stationID *uuid.UUID) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("⚠️  WARNING: JWT_SECRET not set, refusing to generate token")
		return "", fmt.Errorf("JWT_SECRET environment variable must be set")
	}

	claims := jwt.MapClaims{
		"user_id":   userID.String(),
		"full_name": fullName,
		"role":      role,
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	}
	if stationID != nil {
		claims["station_id"] = stationID.String()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash the password securely
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Password hash error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	exists, err := h.userRepo.EmailExists(c.Request.Context(), req.Email)
	if err != nil {
		log.Printf("Email check error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate email"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User already exists",
			"code":  "USER_EXISTS",
		})
		return
	}

	// Create station + user in one transaction to prevent orphan stations on duplicate email.
	user, err := h.userRepo.CreateUserWithStation(c.Request.Context(), req, string(hashedPassword))
	if err != nil {
		log.Printf("Create user error: %v", err)
		c.JSON(http.StatusConflict, gin.H{
			"error": "User already exists",
			"code":  "USER_EXISTS",
		})
		return
	}

	// Registration is pending — no token issued until SuperAdmin approves
	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Your account is pending approval by a SuperAdmin.",
		"user": map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"full_name": user.FullName,
			"role":      user.Role,
			"approved":  user.Approved,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	// 1. Try standard users table first
	user, hash, err := h.userRepo.GetUserByEmail(c.Request.Context(), email)
	if err == nil && user != nil {
		// Verify Password
		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong email or password.", "code": "INVALID_CREDENTIALS"})
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is inactive."})
			return
		}

		if !user.Approved {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account pending approval."})
			return
		}

		tokenStr, _ := GenerateJWT(user.ID, user.FullName, user.Role, user.StationID)
		c.JSON(http.StatusOK, models.AuthResponse{Token: tokenStr, User: *user})
		return
	}

	// 2. Fallback to community users table
	community, err := h.communityRepo.GetByEmail(c.Request.Context(), email)
	if err == nil && community != nil {
		if err := bcrypt.CompareHashAndPassword([]byte(community.PasswordHash), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong email or password.", "code": "INVALID_CREDENTIALS"})
			return
		}

		if !community.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Community account is inactive."})
			return
		}

		tokenStr, _ := GenerateJWT(community.ID, community.FullName, "community", nil)
		c.JSON(http.StatusOK, gin.H{
			"token": tokenStr,
			"user": gin.H{
				"id":         community.ID,
				"full_name":  community.FullName,
				"email":      community.Email,
				"contact_no": community.ContactNo,
				"role":       "community",
				"approved":   true,
				"is_active":  community.IsActive,
			},
		})
		return
	}

	// 3. Both failed
	c.JSON(http.StatusUnauthorized, gin.H{
		"error": "Failed to log in. Wrong email or password.",
		"code":  "INVALID_CREDENTIALS",
	})
}

package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"github.com/sassinzz13/bfp-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo    *repository.UserRepo
	stationRepo *repository.StationRepo
}

func NewAuthHandler(repo *repository.UserRepo, stationRepo *repository.StationRepo) *AuthHandler {
	return &AuthHandler{userRepo: repo, stationRepo: stationRepo}
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

	// Auto-create a station using full_name as station_name
	station, err := h.stationRepo.Create(c.Request.Context(), models.CreateStationRequest{
		StationName: req.FullName,
		City:        req.City,
		District:    req.District,
		Region:      req.Region,
		AddressText: req.AddressText,
	})
	if err != nil {
		log.Printf("Auto-create station error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create station"})
		return
	}

	// Create user linked to the new station
	user, err := h.userRepo.CreateUser(c.Request.Context(), req.Email, req.FullName, string(hashedPassword), "user", &station.ID)
	if err != nil {
		log.Printf("Create user error: %v", err)
		// Usually indicates a unique constraint violation on email
		c.JSON(http.StatusConflict, gin.H{"error": "Email might already be in use"})
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

	user, hash, err := h.userRepo.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Verify Password
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is inactive. Please contact administrator."})
		return
	}

	if !user.Approved {
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account is pending approval. Please wait for a SuperAdmin to approve your registration."})
		return
	}

	tokenStr, err := GenerateJWT(user.ID, user.FullName, user.Role, user.StationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: tokenStr,
		User:  *user,
	})
}

package handlers

import (
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
	userRepo *repository.UserRepo
}

func NewAuthHandler(repo *repository.UserRepo) *AuthHandler {
	return &AuthHandler{userRepo: repo}
}

// GenerateJWT creates a new token valid for 24 hours
func GenerateJWT(userID uuid.UUID, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		if os.Getenv("GIN_MODE") == "release" {
			log.Fatal("FATAL: JWT_SECRET must be set in production")
		}
		log.Println("⚠️  WARNING: JWT_SECRET not set, using insecure default (dev only)")
		secret = "bfpacs_super_secret_key_change_me_in_prod"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.String(),
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

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

	// Safely parse optional stationID
	var stationIDPtr *uuid.UUID
	if req.StationID != nil && *req.StationID != "" {
		id, err := uuid.Parse(*req.StationID)
		if err == nil {
			stationIDPtr = &id
		}
	}

	// Create user in DB
	user, err := h.userRepo.CreateUser(c.Request.Context(), req.Email, req.FullName, string(hashedPassword), "user", stationIDPtr)
	if err != nil {
		log.Printf("Create user error: %v", err)
		// Usually indicates a unique constraint violation on email
		c.JSON(http.StatusConflict, gin.H{"error": "Email might already be in use"})
		return
	}

	// Generate JWT for immediate login
	tokenStr, err := GenerateJWT(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: tokenStr,
		User:  *user,
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

	tokenStr, err := GenerateJWT(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: tokenStr,
		User:  *user,
	})
}

package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders applies standard security headers to all responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'")
		c.Next()
	}
}

// CORSMiddleware handles Cross-Origin Resource Sharing
func CORSMiddleware() gin.HandlerFunc {
	// Build a set for O(1) lookups and exact matching
	allowedOrigins := map[string]bool{
		"http://localhost:5173":      true, // Local React Dev Server
		"http://187.77.136.225:5173": true, // Hostinger VPS Frontend
		"capacitor://localhost":      true, // Ionic/Capacitor iOS/Android
		"http://localhost":           true,
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Exact match prevents subdomain bypass (e.g. http://localhost:5173.evil.com)
		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")
		}

		// Handle Browser Preflight (OPTIONS) requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

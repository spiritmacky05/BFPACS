package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders applies standard security headers to all responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}

// CORSMiddleware handles Cross-Origin Resource Sharing
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// List of permitted origins
		allowedOrigins := []string{
			"http://localhost:5173",        // Local React Dev Server
			"http://187.77.136.225:5173",  // Hostinger VPS Frontend
			"capacitor://localhost",       // Ionic/Capacitor iOS/Android
			"http://localhost",
		}

		isAllowed := false
		for _, o := range allowedOrigins {
			if strings.HasPrefix(origin, o) {
				isAllowed = true
				break
			}
		}

		// If the origin is allowed, set the specific headers for that origin
		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")
		}

		// Handle Browser Preflight (OPTIONS) requests
		if c.Request.Method == "OPTIONS" {
			// If it's an OPTIONS request, we abort here with 204 No Content
			// but with the CORS headers already set above
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

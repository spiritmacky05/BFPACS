package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiter sets up a simple memory store rate limiter
// Used to protect against basic brute force / DDoS on Auth bounds
func RateLimiter() gin.HandlerFunc {
	// Let's create a limit: e.g., 5 requests per second
	rate, err := limiter.NewRateFromFormatted("5-S")
	if err != nil {
		log.Fatal("Could not configure rate limiter:", err)
	}

	store := memory.NewStore()
	instance := limiter.New(store, rate)

	// Returns a Gin middleware
	return mgin.NewMiddleware(instance, mgin.WithLimitReachedHandler(func(c *gin.Context) {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":   "Too Many Requests",
			"message": "Slow down, you're hitting the API too fast.",
		})
		c.Abort()
	}))
}

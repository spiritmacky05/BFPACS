package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// isSuperAdmin returns true if the current user has the superadmin role.
// Case-insensitive so it handles "SuperAdmin", "superadmin", etc.
func isSuperAdmin(c *gin.Context) bool {
	raw, exists := c.Get("role")
	if !exists {
		return false
	}
	roleStr, ok := raw.(string)
	return ok && strings.EqualFold(roleStr, "superadmin")
}

// getStationID extracts the station_id from the JWT context and returns it
// as a *uuid.UUID. Returns nil if the user has no station_id set.
func getStationID(c *gin.Context) *uuid.UUID {
	raw, exists := c.Get("stationID")
	if !exists {
		return nil
	}
	str, ok := raw.(string)
	if !ok || str == "" {
		return nil
	}
	id, err := uuid.Parse(str)
	if err != nil {
		return nil
	}
	return &id
}

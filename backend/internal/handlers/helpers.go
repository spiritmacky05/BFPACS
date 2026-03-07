package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// isSuperAdmin returns true if the current user has the superadmin role.
func isSuperAdmin(c *gin.Context) bool {
	role, _ := c.Get("role")
	return role == "superadmin"
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

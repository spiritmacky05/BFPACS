package models

import (
	"time"

	"github.com/google/uuid"
)

// Fleet maps to public.fleets
// current_location (PostGIS) is decomposed to Lat/Lng float64 for JSON serialization
type Fleet struct {
	ID                      uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	StationID               *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid"`
	UserID                  *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid"`
	EngineCode              string     `json:"engine_code"`
	PlateNumber             string     `json:"plate_number"`
	VehicleType             string     `json:"vehicle_type"`
	FTCapacity              *string    `json:"ft_capacity,omitempty"`
	Status                  string     `json:"status"`
	ACSStatus               string     `json:"acs_status"`
	Lat                     *float64   `json:"lat,omitempty"`
	Lng                     *float64   `json:"lng,omitempty"`
	CurrentAssignmentStatus *string    `json:"current_assignment_status,omitempty"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`
}

// CreateFleetRequest is the request body for creating a fleet
type CreateFleetRequest struct {
	StationID   *uuid.UUID `json:"station_id"`
	UserID      *uuid.UUID `json:"user_id"`
	EngineCode  string     `json:"engine_code" binding:"required"`
	PlateNumber string     `json:"plate_number" binding:"required"`
	VehicleType string     `json:"vehicle_type" binding:"required"`
	FTCapacity  *string    `json:"ft_capacity"`
	Status      string     `json:"status"`
	ACSStatus   string     `json:"acs_status"`
}

// UpdateLocationRequest is used to update a fleet's GPS position
type UpdateFleetLocationRequest struct {
	Lat float64 `json:"lat" binding:"required"`
	Lng float64 `json:"lng" binding:"required"`
}

// FleetMovementLog maps to public.fleet_movement_logs
// location_point (PostGIS) is decomposed to Lat/Lng
type FleetMovementLog struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	DispatchID      *uuid.UUID `json:"dispatch_id,omitempty" gorm:"type:uuid"`
	FleetID         *uuid.UUID `json:"fleet_id,omitempty" gorm:"type:uuid"`
	StatusCode      string     `json:"status_code"` // e.g. "10-70", "10-23"
	Lat             *float64   `json:"lat,omitempty"`
	Lng             *float64   `json:"lng,omitempty"`
	RecordedAt      time.Time  `json:"recorded_at"`
	BatteryLevel    *int       `json:"battery_level,omitempty"`
	Heading         *float64   `json:"heading,omitempty"`
	Purpose         *string    `json:"purpose,omitempty"`
	DestinationText *string    `json:"destination_text,omitempty"`
	OdometerReading *int       `json:"odometer_reading,omitempty"`
}

// LogMovementRequest is the request body for logging a fleet movement
type LogMovementRequest struct {
	DispatchID      *uuid.UUID `json:"dispatch_id"`
	StatusCode      string     `json:"status_code" binding:"required"`
	Lat             *float64   `json:"lat"`
	Lng             *float64   `json:"lng"`
	BatteryLevel    *int       `json:"battery_level"`
	Heading         *float64   `json:"heading"`
	Purpose         *string    `json:"purpose"`
	DestinationText *string    `json:"destination_text"`
	OdometerReading *int       `json:"odometer_reading"`
}

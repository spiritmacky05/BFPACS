package models

import (
	"time"

	"github.com/google/uuid"
)

// Hydrant maps to public.hydrants
// location/geo_location (PostGIS) decomposed to Lat/Lng
type Hydrant struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	StationID   *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid"`
	AddressText *string    `json:"address_text,omitempty"`
	City        *string    `json:"city,omitempty"`
	Status      string     `json:"status"`
	Lat         *float64   `json:"lat,omitempty"`
	Lng         *float64   `json:"lng,omitempty"`
	District    *string    `json:"district,omitempty"`
	Region      *string    `json:"region,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// CreateHydrantRequest is the request body for adding a hydrant
type CreateHydrantRequest struct {
	StationID   *uuid.UUID `json:"station_id"`
	AddressText *string    `json:"address_text"`
	City        *string    `json:"city"`
	Status      string     `json:"status"`
	Lat         float64    `json:"lat" binding:"required"`
	Lng         float64    `json:"lng" binding:"required"`
	District    *string    `json:"district"`
	Region      *string    `json:"region"`
}

// NearbyHydrant extends Hydrant with a distance field for nearby queries
type NearbyHydrant struct {
	Hydrant
	DistanceMeters float64 `json:"distance_meters"`
}

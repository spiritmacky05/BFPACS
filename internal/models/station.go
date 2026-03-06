package models

import (
	"time"

	"github.com/google/uuid"
)

// Station maps to public.stations
type Station struct {
	ID                uuid.UUID `json:"id"`
	StationName       string    `json:"station_name"`
	ContactNumber     *string   `json:"contact_number,omitempty"`
	TeamLeaderContact *string   `json:"team_leader_contact,omitempty"`
	AddressText       *string   `json:"address_text,omitempty"`
	City              string    `json:"city"`
	District          string    `json:"district"`
	Region            string    `json:"region"`
	Lat               *float64  `json:"lat,omitempty"`
	Lng               *float64  `json:"lng,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// CreateStationRequest is the request body for creating a fire station
type CreateStationRequest struct {
	StationName       string   `json:"station_name" binding:"required"`
	ContactNumber     *string  `json:"contact_number"`
	TeamLeaderContact *string  `json:"team_leader_contact"`
	AddressText       *string  `json:"address_text"`
	City              string   `json:"city" binding:"required"`
	District          string   `json:"district" binding:"required"`
	Region            string   `json:"region" binding:"required"`
	Lat               *float64 `json:"lat"`
	Lng               *float64 `json:"lng"`
}

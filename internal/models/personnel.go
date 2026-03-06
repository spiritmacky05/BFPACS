package models

import (
	"time"

	"github.com/google/uuid"
)

// DutyPersonnel maps to public.duty_personnel
type DutyPersonnel struct {
	ID                 uuid.UUID  `json:"id"`
	StationID          *uuid.UUID `json:"station_id,omitempty"`
	FleetID            *uuid.UUID `json:"fleet_id,omitempty"`
	FullName           string     `json:"full_name"`
	Rank               string     `json:"rank"`
	Designation        *string    `json:"designation,omitempty"`
	Shift              *string    `json:"shift,omitempty"`
	DutyStatus         string     `json:"duty_status"`
	IsStationCommander bool       `json:"is_station_commander"`
	NFCTagID           *string    `json:"nfc_tag_id,omitempty"`
	PinCode            *string    `json:"pin_code,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// CreatePersonnelRequest is the request body for creating a new personnel record
type CreatePersonnelRequest struct {
	StationID          *uuid.UUID `json:"station_id"`
	FleetID            *uuid.UUID `json:"fleet_id"`
	FullName           string     `json:"full_name" binding:"required"`
	Rank               string     `json:"rank" binding:"required"`
	Designation        *string    `json:"designation"`
	Shift              *string    `json:"shift"`
	DutyStatus         string     `json:"duty_status"`
	IsStationCommander bool       `json:"is_station_commander"`
	NFCTagID           *string    `json:"nfc_tag_id"`
	PinCode            *string    `json:"pin_code"`
}

// UpdateDutyStatusRequest is the request body for updating duty status
type UpdateDutyStatusRequest struct {
	DutyStatus string `json:"duty_status" binding:"required"`
}

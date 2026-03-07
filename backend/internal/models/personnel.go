package models

import (
	"time"

	"github.com/google/uuid"
)

// DutyPersonnel maps to public.duty_personnel
type DutyPersonnel struct {
	ID                 uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	StationID          *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid;index"`
	FleetID            *uuid.UUID `json:"fleet_id,omitempty" gorm:"type:uuid;index"`
	FullName           string     `json:"full_name"`
	Rank               string     `json:"rank"`
	Designation        *string    `json:"designation,omitempty"`
	Shift              *string    `json:"shift,omitempty"`
	DutyStatus         string     `json:"duty_status" gorm:"index"`
	IsStationCommander bool       `json:"is_station_commander"`
	NFCTagID           *string    `json:"nfc_tag_id,omitempty" gorm:"uniqueIndex"`
	PinCode            *string    `json:"pin_code,omitempty" gorm:"uniqueIndex"`
	Certification      *string    `json:"certification,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`

	// Relation – populated via Preload("Station")
	Station *Station `json:"station,omitempty" gorm:"foreignKey:StationID"`
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
	Certification      *string    `json:"certification"`
}

// UpdateDutyStatusRequest is the request body for updating duty status
type UpdateDutyStatusRequest struct {
	DutyStatus string `json:"duty_status" binding:"required"`
}

// UpdatePersonnelRequest is the request body for editing a personnel record
type UpdatePersonnelRequest struct {
	FullName           *string `json:"full_name"`
	Rank               *string `json:"rank"`
	Shift              *string `json:"shift"`
	DutyStatus         *string `json:"duty_status"`
	Certification      *string `json:"certification"`
	IsStationCommander *bool   `json:"is_station_commander"`
}

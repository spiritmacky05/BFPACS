package models

import (
	"time"

	"github.com/google/uuid"
)

// LogisticalEquipment maps to public.logistical_equipment
type LogisticalEquipment struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	StationID     *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid;index"`
	FleetID       *uuid.UUID `json:"fleet_id,omitempty" gorm:"type:uuid"`
	EquipmentName string     `json:"equipment_name"`
	Quantity      int        `json:"quantity"`
	Status        string     `json:"status"`
	BorrowerName  *string    `json:"borrower_name,omitempty"`
	BorrowedAt    *time.Time `json:"borrowed_at,omitempty"`
	ReturnedAt    *time.Time `json:"returned_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// CreateEquipmentRequest is the request body for adding equipment
type CreateEquipmentRequest struct {
	StationID     *uuid.UUID `json:"station_id"`
	FleetID       *uuid.UUID `json:"fleet_id"`
	EquipmentName string     `json:"equipment_name" binding:"required"`
	Quantity      int        `json:"quantity"`
	Status        string     `json:"status"`
}

// BorrowEquipmentRequest is the request body for borrowing equipment
type BorrowEquipmentRequest struct {
	BorrowerName string `json:"borrower_name" binding:"required"`
}

// UpdateEquipmentRequest is the request body for updating equipment
type UpdateEquipmentRequest struct {
	EquipmentName string  `json:"equipment_name" binding:"required"`
	Quantity      int     `json:"quantity"`
	Status        string  `json:"status"`
	BorrowerName  *string `json:"borrower_name"`
}

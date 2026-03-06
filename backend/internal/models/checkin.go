package models

import (
	"time"

	"github.com/google/uuid"
)

// PersonnelIncidentLog maps to public.personnel_incident_logs
type PersonnelIncidentLog struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	IncidentID    *uuid.UUID `json:"incident_id,omitempty" gorm:"type:uuid;index:idx_checkin_incident_personnel"`
	PersonnelID   *uuid.UUID `json:"personnel_id,omitempty" gorm:"type:uuid;index:idx_checkin_incident_personnel"`
	CheckInMethod string     `json:"check_in_method"` // NFC | PIN | Manual
	CheckInTime   time.Time  `json:"check_in_time" gorm:"autoCreateTime"`
	CheckOutTime  *time.Time `json:"check_out_time,omitempty"`
	EntryType     string     `json:"entry_type"`
}

// NFCCheckInRequest is the body for an NFC-based check-in
type NFCCheckInRequest struct {
	NFCTagID   string    `json:"nfc_tag_id" binding:"required"`
	IncidentID uuid.UUID `json:"incident_id" binding:"required"`
}

// PINCheckInRequest is the body for a PIN-based check-in
type PINCheckInRequest struct {
	PinCode    string    `json:"pin_code" binding:"required"`
	IncidentID uuid.UUID `json:"incident_id" binding:"required"`
}

// ManualCheckInRequest is the body for an admin/UI-initiated check-in by personnel UUID
type ManualCheckInRequest struct {
	PersonnelID uuid.UUID `json:"personnel_id" binding:"required"`
	IncidentID  uuid.UUID `json:"incident_id" binding:"required"`
}

// CheckInResponse is the response returned after a successful check-in
type CheckInResponse struct {
	Log       PersonnelIncidentLog `json:"log"`
	Personnel DutyPersonnel        `json:"personnel"`
	Message   string               `json:"message"`
}

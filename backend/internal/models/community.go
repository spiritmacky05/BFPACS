package models

import (
	"time"

	"github.com/google/uuid"
)

// Community maps to public.community
type Community struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	FullName     string    `json:"full_name"`
	Email        string    `json:"email" gorm:"uniqueIndex:community_email_key;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash"`
	ContactNo    *string   `json:"contact_no,omitempty"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// RegisterCommunityRequest is used for community sign-up.
type RegisterCommunityRequest struct {
	FullName  string  `json:"full_name" binding:"required"`
	Email     string  `json:"email" binding:"required,email"`
	Password  string  `json:"password" binding:"required,min=8"`
	ContactNo *string `json:"contact_no"`
}

// LoginCommunityRequest is used for community sign-in.
type LoginCommunityRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// CommunityIncidentReport stores citizen-submitted reports linked to incidents.
type CommunityIncidentReport struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	IncidentID   uuid.UUID  `json:"incident_id" gorm:"type:uuid;index"`
	CommunityID  uuid.UUID  `json:"community_id" gorm:"type:uuid;index"`
	ReporterName string     `json:"reporter_name"`
	Description  string     `json:"description"`
	LocationText string     `json:"location_text"`
	Lat          *float64   `json:"lat,omitempty"`
	Lng          *float64   `json:"lng,omitempty"`
	MediaDataURL *string    `json:"media_data_url,omitempty" gorm:"type:text"`
	MediaType    *string    `json:"media_type,omitempty"`
	MapURL       *string    `json:"map_url,omitempty" gorm:"type:text"`
	CreatedAt    time.Time  `json:"created_at"`
}

// CreateCommunityIncidentReportRequest is sent by community users.
type CreateCommunityIncidentReportRequest struct {
	Description  string   `json:"description" binding:"required"`
	LocationText string   `json:"location_text" binding:"required"`
	Lat          *float64 `json:"lat"`
	Lng          *float64 `json:"lng"`
	MediaDataURL *string  `json:"media_data_url"`
	MediaType    *string  `json:"media_type"`
	MapURL       *string  `json:"map_url"`
}

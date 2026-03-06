package models

import (
	"time"

	"github.com/google/uuid"
)

// User maps to public.users (password_hash never serialized)
type User struct {
	ID        uuid.UUID  `json:"id"`
	Email     string     `json:"email"`
	FullName  string     `json:"full_name"`
	StationID *uuid.UUID `json:"station_id,omitempty"`
	Role      string     `json:"role"`
	IsActive  bool       `json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

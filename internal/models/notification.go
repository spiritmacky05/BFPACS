package models

import (
	"time"

	"github.com/google/uuid"
)

// Notification maps to public.notifications
type Notification struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid;index"`
	Title     string     `json:"title"`
	Message   string     `json:"message"`
	IsRead    bool       `json:"is_read"`
	CreatedAt time.Time  `json:"created_at"`
}

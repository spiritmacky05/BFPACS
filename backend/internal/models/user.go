package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User maps to public.users (password_hash never serialized)
type User struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Email        string     `json:"email" gorm:"uniqueIndex;not null"`
	FullName     string     `json:"full_name"`
	PasswordHash string     `json:"-" gorm:"column:password_hash"`
	StationID    *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid"`
	Role         string     `json:"role"`
	IsActive     bool       `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// BeforeSave hook to lowercase emails before inserted into DB
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	u.Email = strings.ToLower(u.Email)
	return nil
}

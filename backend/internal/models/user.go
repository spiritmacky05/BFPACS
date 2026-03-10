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
	Email        string     `json:"email" gorm:"uniqueIndex:users_email_key;not null"`
	FullName     string     `json:"full_name"`
	PasswordHash string     `json:"-" gorm:"column:password_hash"`
	StationID    *uuid.UUID `json:"station_id,omitempty" gorm:"type:uuid"`
	Role         string     `json:"role"`
	Approved     bool       `json:"approved" gorm:"default:false"`
	IsActive     bool       `json:"is_active" gorm:"default:true"`

	// SuperAdmin-managed fields
	UserType             *string `json:"user_type,omitempty"`
	SubRole              *string `json:"sub_role,omitempty"`
	PersonnelType        *string `json:"personnel_type,omitempty"`
	TypeOfVehicle        *string `json:"type_of_vehicle,omitempty"`
	EngineNumber         *string `json:"engine_number,omitempty"`
	PlateNumber          *string `json:"plate_number,omitempty"`
	FireTruckCapacity    *int    `json:"fire_truck_capacity,omitempty"`
	CityFireMarshal      *string `json:"city_fire_marshal,omitempty"`
	StationCommander     *string `json:"station_commander,omitempty"`
	StationContactNumber *string `json:"station_contact_number,omitempty"`
	ACSStatus            *string `json:"acs_status,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UpdateUserRequest struct {
	FullName             *string `json:"full_name"`
	Role                 *string `json:"role"`
	Approved             *bool   `json:"approved"`
	IsActive             *bool   `json:"is_active"`
	UserType             *string `json:"user_type"`
	SubRole              *string `json:"sub_role"`
	PersonnelType        *string `json:"personnel_type"`
	TypeOfVehicle        *string `json:"type_of_vehicle"`
	EngineNumber         *string `json:"engine_number"`
	PlateNumber          *string `json:"plate_number"`
	FireTruckCapacity    *int    `json:"fire_truck_capacity"`
	CityFireMarshal      *string `json:"city_fire_marshal"`
	StationCommander     *string `json:"station_commander"`
	StationContactNumber *string `json:"station_contact_number"`
	ACSStatus            *string `json:"acs_status"`
	StationID            *string `json:"station_id"`
}

// BeforeSave hook to lowercase emails before inserted into DB
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	u.Email = strings.ToLower(u.Email)
	return nil
}

package models

import (
	"time"

	"github.com/google/uuid"
)

// Deployment maps to public.deployments
type Deployment struct {
	ID               uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	NameOfDeployment string     `json:"name_of_deployment"`
	LocationText     string     `json:"location_text"`
	Lat              *float64   `json:"lat,omitempty"`
	Lng              *float64   `json:"lng,omitempty"`
	Status           string     `json:"status"`
	TeamLeader       *string    `json:"team_leader,omitempty"`
	Remarks          *string    `json:"remarks,omitempty"`
	StartTime        time.Time  `json:"start_time" gorm:"autoCreateTime"`
	EndTime          *time.Time `json:"end_time,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// CreateDeploymentRequest is the request body for creating a deployment
type CreateDeploymentRequest struct {
	NameOfDeployment string   `json:"name_of_deployment" binding:"required"`
	LocationText     string   `json:"location_text" binding:"required"`
	Lat              *float64 `json:"lat"`
	Lng              *float64 `json:"lng"`
	TeamLeader       *string  `json:"team_leader"`
	Remarks          *string  `json:"remarks"`
}

// DeploymentAssignment maps to public.deployment_assignments
type DeploymentAssignment struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	DeploymentID    *uuid.UUID `json:"deployment_id,omitempty" gorm:"type:uuid;index"`
	FleetID         *uuid.UUID `json:"fleet_id,omitempty" gorm:"type:uuid;index"`
	CheckInTime     time.Time  `json:"check_in_time"`
	CheckOutTime    *time.Time `json:"check_out_time,omitempty"`
	SituationUpdate *string    `json:"situation_update,omitempty"`
	PhotoURL        *string    `json:"photo_url,omitempty"`
}

// AssignFleetToDeploymentRequest links a fleet to a deployment
type AssignFleetToDeploymentRequest struct {
	FleetID uuid.UUID `json:"fleet_id" binding:"required"`
}

// UpdateAssignmentRequest updates the situation update on a deployment assignment
type UpdateAssignmentRequest struct {
	SituationUpdate *string `json:"situation_update"`
	PhotoURL        *string `json:"photo_url"`
	CheckOut        bool    `json:"check_out"` // if true, sets check_out_time = NOW()
}

package models

import (
	"time"

	"github.com/google/uuid"
)

// SituationalReport maps to public.situational_reports
type SituationalReport struct {
	ID                    uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	IncidentID            *uuid.UUID `json:"incident_id,omitempty" gorm:"type:uuid"`
	DeploymentID          *uuid.UUID `json:"deployment_id,omitempty" gorm:"type:uuid"`
	ReporterID            *uuid.UUID `json:"reporter_id,omitempty" gorm:"type:uuid"`
	SituationText         string     `json:"situation_text"`
	Remarks               *string    `json:"remarks,omitempty"`
	PhotoURL              *string    `json:"photo_url,omitempty"`
	PersonnelCount        *int       `json:"personnel_count,omitempty"`
	EquipmentCount        *int       `json:"equipment_count,omitempty"`
	ReportType            string     `json:"report_type"` // Situational | Incident | Inspection
	SubjectText           *string    `json:"subject_text,omitempty"`
	InvolvedOccupancyType *string    `json:"involved_occupancy_type,omitempty"`
	TeamLeaderID          *uuid.UUID `json:"team_leader_id,omitempty" gorm:"type:uuid"`
	AreaOfDeploymentText  *string    `json:"area_of_deployment_text,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
}

// CreateReportRequest is the body for submitting a situational report
type CreateReportRequest struct {
	IncidentID            *uuid.UUID `json:"incident_id"`
	DeploymentID          *uuid.UUID `json:"deployment_id"`
	ReporterID            *uuid.UUID `json:"reporter_id"`
	SituationText         string     `json:"situation_text" binding:"required"`
	Remarks               *string    `json:"remarks"`
	PhotoURL              *string    `json:"photo_url"`
	PersonnelCount        *int       `json:"personnel_count"`
	EquipmentCount        *int       `json:"equipment_count"`
	ReportType            string     `json:"report_type"`
	SubjectText           *string    `json:"subject_text"`
	InvolvedOccupancyType *string    `json:"involved_occupancy_type"`
	TeamLeaderID          *uuid.UUID `json:"team_leader_id"`
	AreaOfDeploymentText  *string    `json:"area_of_deployment_text"`
}

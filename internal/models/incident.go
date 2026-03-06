package models

import (
	"time"

	"github.com/google/uuid"
)

// FireIncident maps to public.fire_incidents
// geo_location (PostGIS) decomposed to Lat/Lng
type FireIncident struct {
	ID                         uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ReportedBy                 *uuid.UUID `json:"reported_by,omitempty" gorm:"type:uuid"`
	LocationText               string     `json:"location_text"`
	Lat                        *float64   `json:"lat,omitempty"`
	Lng                        *float64   `json:"lng,omitempty"`
	DateTimeReported           time.Time  `json:"date_time_reported"`
	OccupancyType              *string    `json:"occupancy_type,omitempty"`
	InvolvedType               *string    `json:"involved_type,omitempty"`
	AlarmStatus                string     `json:"alarm_status"`
	IncidentStatus             string     `json:"incident_status"`
	GroundCommander            *string    `json:"ground_commander,omitempty"`
	ICSCommander               *string    `json:"ics_commander,omitempty"`
	TotalInjured               int        `json:"total_injured"`
	TotalRescued               int        `json:"total_rescued"`
	OccupancyCategory          *string    `json:"occupancy_category,omitempty"`
	InvolvesHazardousMaterials bool       `json:"involves_hazardous_materials"`
	ResponseType               string     `json:"response_type"`
	CreatedAt                  time.Time  `json:"created_at"`
	UpdatedAt                  time.Time  `json:"updated_at"`
}

// CreateIncidentRequest is the request body for reporting a new fire incident (10-70)
type CreateIncidentRequest struct {
	ReportedBy                 *uuid.UUID `json:"reported_by"`
	LocationText               string     `json:"location_text" binding:"required"`
	Lat                        *float64   `json:"lat"`
	Lng                        *float64   `json:"lng"`
	OccupancyType              *string    `json:"occupancy_type"`
	InvolvedType               *string    `json:"involved_type"`
	AlarmStatus                string     `json:"alarm_status"`
	GroundCommander            *string    `json:"ground_commander"`
	OccupancyCategory          *string    `json:"occupancy_category"`
	InvolvesHazardousMaterials bool       `json:"involves_hazardous_materials"`
	ResponseType               string     `json:"response_type"`
}

// UpdateIncidentStatusRequest is used to change the status/alarm level of an incident
type UpdateIncidentStatusRequest struct {
	IncidentStatus  *string `json:"incident_status"`
	AlarmStatus     *string `json:"alarm_status"`
	GroundCommander *string `json:"ground_commander"`
	ICSCommander    *string `json:"ics_commander"`
	TotalInjured    *int    `json:"total_injured"`
	TotalRescued    *int    `json:"total_rescued"`
}

// IncidentDispatch maps to public.incident_dispatches
type IncidentDispatch struct {
	ID                uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	IncidentID        *uuid.UUID `json:"incident_id,omitempty" gorm:"type:uuid"`
	FleetID           *uuid.UUID `json:"fleet_id,omitempty" gorm:"type:uuid"`
	DispatchStatus    *string    `json:"dispatch_status,omitempty"` // e.g. "En Route", "10-23 Arrived at Scene"
	CheckInTime       time.Time  `json:"check_in_time"`
	CheckOutTime      *time.Time `json:"check_out_time,omitempty"`
	SituationalReport *string    `json:"situational_report,omitempty"`
}

// DispatchFleetRequest dispatches a fleet vehicle to an incident
type DispatchFleetRequest struct {
	IncidentID uuid.UUID `json:"incident_id" binding:"required"`
	FleetID    uuid.UUID `json:"fleet_id" binding:"required"`
}

// UpdateDispatchStatusRequest updates the BFP radio code status of a dispatch
type UpdateDispatchStatusRequest struct {
	DispatchStatus    string  `json:"dispatch_status" binding:"required"` // "10-23", "Fire Out", etc.
	SituationalReport *string `json:"situational_report"`
}

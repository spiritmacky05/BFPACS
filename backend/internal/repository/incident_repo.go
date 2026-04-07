package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type IncidentRepo struct {
	db *gorm.DB
}

func NewIncidentRepo(db *gorm.DB) *IncidentRepo {
	return &IncidentRepo{db: db}
}

func (r *IncidentRepo) GetAll(ctx context.Context) ([]models.FireIncident, error) {
	var list []models.FireIncident
	err := r.db.WithContext(ctx).Order("date_time_reported DESC").Find(&list).Error
	return list, err
}

func (r *IncidentRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.FireIncident, error) {
	var i models.FireIncident
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&i).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &i, nil
}

func (r *IncidentRepo) Create(ctx context.Context, req models.CreateIncidentRequest) (*models.FireIncident, error) {
	alarmStatus := req.AlarmStatus
	if alarmStatus == "" {
		alarmStatus = "1st Alarm"
	}
	responseType := req.ResponseType
	if responseType == "" {
		responseType = "Fire Incident"
	}

	// Use the provided date/time or default to now
	reportedAt := time.Now()
	if req.DateTimeReported != nil {
		reportedAt = *req.DateTimeReported
	}

	i := models.FireIncident{
		ReportedBy:                 req.ReportedBy,
		LocationText:               req.LocationText,
		Lat:                        req.Lat,
		Lng:                        req.Lng,
		DateTimeReported:           reportedAt,
		OccupancyType:              req.OccupancyType,
		InvolvedType:               req.InvolvedType,
		AlarmStatus:                alarmStatus,
		IncidentStatus:             "Active", // Defaults to Active
		GroundCommander:            req.GroundCommander,
		OccupancyCategory:          req.OccupancyCategory,
		InvolvesHazardousMaterials: req.InvolvesHazardousMaterials,
		ResponseType:               responseType,
		ImageDataURL:               req.ImageDataURL,
		ImageMimeType:              req.ImageMimeType,
	}

	if err := r.db.WithContext(ctx).Create(&i).Error; err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *IncidentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, req models.UpdateIncidentStatusRequest, userName string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var incident models.FireIncident
		if err := tx.Where("id = ?", id).First(&incident).Error; err != nil {
			return err
		}

		updates := make(map[string]interface{})
		logs := []models.IncidentStatusLog{}

		if req.IncidentStatus != nil && *req.IncidentStatus != incident.IncidentStatus {
			updates["incident_status"] = *req.IncidentStatus
			logs = append(logs, models.IncidentStatusLog{
				IncidentID: id,
				UserName:   userName,
				Status:     "Incident Status changed to " + *req.IncidentStatus,
			})
		}
		if req.AlarmStatus != nil && *req.AlarmStatus != incident.AlarmStatus {
			updates["alarm_status"] = *req.AlarmStatus
			logs = append(logs, models.IncidentStatusLog{
				IncidentID: id,
				UserName:   userName,
				Status:     "Alarm Status changed to " + *req.AlarmStatus,
			})
		}

		// Validation: Commanders must have 'manager' role
		// The previous managerCount check is now replaced by the hardened validation above.
		if req.GroundCommander != nil && (incident.GroundCommander == nil || *req.GroundCommander != *incident.GroundCommander) {
			updates["ground_commander"] = *req.GroundCommander
			logs = append(logs, models.IncidentStatusLog{
				IncidentID: id,
				UserName:   userName,
				Status:     "Ground Commander set to " + *req.GroundCommander,
			})
		}

		if req.ICSCommander != nil && (incident.ICSCommander == nil || *req.ICSCommander != *incident.ICSCommander) {
			var managerCount int64
			tx.Model(&models.User{}).Where("full_name = ? AND sub_role = 'manager'", *req.ICSCommander).Count(&managerCount)
			if managerCount == 0 {
				// return errors.New("ICS Commander must have the MANAGER role")
			}
			updates["ics_commander"] = *req.ICSCommander
			logs = append(logs, models.IncidentStatusLog{
				IncidentID: id,
				UserName:   userName,
				Status:     "ICS Commander set to " + *req.ICSCommander,
			})
		}

		if req.TotalInjured != nil && *req.TotalInjured != incident.TotalInjured {
			updates["total_injured"] = *req.TotalInjured
			logs = append(logs, models.IncidentStatusLog{
				IncidentID: id,
				UserName:   userName,
				Status:     "Total Injured updated",
			})
		}
		if req.TotalRescued != nil && *req.TotalRescued != incident.TotalRescued {
			updates["total_rescued"] = *req.TotalRescued
			logs = append(logs, models.IncidentStatusLog{
				IncidentID: id,
				UserName:   userName,
				Status:     "Total Rescued updated",
			})
		}

		if len(updates) > 0 {
			if err := tx.Model(&models.FireIncident{}).Where("id = ?", id).Updates(updates).Error; err != nil {
				return err
			}
			for _, log := range logs {
				if err := tx.Create(&log).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *IncidentRepo) GetStatusHistory(ctx context.Context, incidentID uuid.UUID) ([]models.IncidentStatusLog, error) {
	var logs []models.IncidentStatusLog
	err := r.db.WithContext(ctx).Where("incident_id = ?", incidentID).Order("timestamp DESC").Find(&logs).Error
	return logs, err
}

// CheckOutAllPersonnel sets check_out_time = NOW() for every open check-in log
// (check_out_time IS NULL) linked to the given incident. Called on "Fire Out".
func (r *IncidentRepo) CheckOutAllPersonnel(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Exec(`UPDATE personnel_incident_logs SET check_out_time = ? WHERE incident_id = ? AND check_out_time IS NULL`, now, id).
		Error
}

func (r *IncidentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.FireIncident{}).Error
}

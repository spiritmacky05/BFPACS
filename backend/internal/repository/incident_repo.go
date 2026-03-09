package repository

import (
	"context"
	"errors"

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

	i := models.FireIncident{
		ReportedBy:                 req.ReportedBy,
		LocationText:               req.LocationText,
		Lat:                        req.Lat,
		Lng:                        req.Lng,
		OccupancyType:              req.OccupancyType,
		InvolvedType:               req.InvolvedType,
		AlarmStatus:                alarmStatus,
		IncidentStatus:             "Active", // Defaults to Active
		GroundCommander:            req.GroundCommander,
		OccupancyCategory:          req.OccupancyCategory,
		InvolvesHazardousMaterials: req.InvolvesHazardousMaterials,
		ResponseType:               responseType,
	}

	if err := r.db.WithContext(ctx).Create(&i).Error; err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *IncidentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, req models.UpdateIncidentStatusRequest) error {
	updates := make(map[string]interface{})
	if req.IncidentStatus != nil {
		updates["incident_status"] = *req.IncidentStatus
	}
	if req.AlarmStatus != nil {
		updates["alarm_status"] = *req.AlarmStatus
	}
	if req.GroundCommander != nil {
		updates["ground_commander"] = *req.GroundCommander
	}
	if req.ICSCommander != nil {
		updates["ics_commander"] = *req.ICSCommander
	}
	if req.TotalInjured != nil {
		updates["total_injured"] = *req.TotalInjured
	}
	if req.TotalRescued != nil {
		updates["total_rescued"] = *req.TotalRescued
	}
	if len(updates) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Model(&models.FireIncident{}).Where("id = ?", id).Updates(updates).Error
}

func (r *IncidentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.FireIncident{}).Error
}

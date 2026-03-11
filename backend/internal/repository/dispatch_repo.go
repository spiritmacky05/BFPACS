package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type DispatchRepo struct {
	db *gorm.DB
}

func NewDispatchRepo(db *gorm.DB) *DispatchRepo {
	return &DispatchRepo{db: db}
}

func (r *DispatchRepo) DispatchResponder(ctx context.Context, req models.DispatchRequest) (*models.IncidentDispatch, error) {
	status := "En Route"
	d := models.IncidentDispatch{
		IncidentID:        &req.IncidentID,
		FleetID:           &req.FleetID,
		DispatchStatus:    &status,
		SituationalReport: req.SituationalReport,
	}
	if err := r.db.WithContext(ctx).Create(&d).Error; err != nil {
		return nil, err
	}
	// Reload with Fleet.User preloaded
	if err := r.db.WithContext(ctx).Preload("Fleet.User").Where("id = ?", d.ID).First(&d).Error; err != nil {
		return &d, nil // return without preload rather than failing
	}
	return &d, nil
}

func (r *DispatchRepo) UpdateStatus(ctx context.Context, id uuid.UUID, req models.UpdateDispatchStatusRequest) error {
	updates := map[string]interface{}{
		"dispatch_status": req.DispatchStatus,
	}
	if req.SituationalReport != nil {
		updates["situational_report"] = *req.SituationalReport
	}
	return r.db.WithContext(ctx).Model(&models.IncidentDispatch{}).Where("id = ?", id).Updates(updates).Error
}

func (r *DispatchRepo) GetByIncident(ctx context.Context, incidentID uuid.UUID) ([]models.IncidentDispatch, error) {
	var list []models.IncidentDispatch
	err := r.db.WithContext(ctx).Preload("Fleet.User").Where("incident_id = ?", incidentID).Order("check_in_time DESC").Find(&list).Error
	return list, err
}

func (r *DispatchRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.IncidentDispatch, error) {
	var d models.IncidentDispatch
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&d).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

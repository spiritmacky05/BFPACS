package checkin

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

// CheckInRepo handles personnel_incident_logs for NFC/PIN check-ins
type CheckInRepo struct {
	db *gorm.DB
}

func NewCheckInRepo(db *gorm.DB) *CheckInRepo {
	return &CheckInRepo{db: db}
}

// IsCheckedIn returns true if the personnel is currently checked in (no check_out_time) for the incident
func (r *CheckInRepo) IsCheckedIn(ctx context.Context, personnelID, incidentID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.PersonnelIncidentLog{}).
		Where("personnel_id = ? AND incident_id = ? AND check_out_time IS NULL", personnelID, incidentID).
		Count(&count).Error
	return count > 0, err
}

// CheckIn inserts a new check-in log entry for a personnel member
func (r *CheckInRepo) CheckIn(ctx context.Context, personnelID, incidentID uuid.UUID, method string) (*models.PersonnelIncidentLog, error) {
	incID := incidentID
	perID := personnelID
	log := models.PersonnelIncidentLog{
		IncidentID:    &incID,
		PersonnelID:   &perID,
		CheckInMethod: method,
		EntryType:     method,
	}
	if err := r.db.WithContext(ctx).Create(&log).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

// CheckOut sets the check_out_time for an open log entry
func (r *CheckInRepo) CheckOut(ctx context.Context, logID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&models.PersonnelIncidentLog{}).Where("id = ?", logID).Update("check_out_time", &now).Error
}

// GetPersonnelByNFCTag performs an indexed lookup on nfc_tag_id
func (r *CheckInRepo) GetPersonnelByNFCTag(ctx context.Context, tagID string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	if err := r.db.WithContext(ctx).Where("nfc_tag_id = ?", tagID).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// GetPersonnelByID looks up a duty personnel record by UUID
func (r *CheckInRepo) GetPersonnelByID(ctx context.Context, id uuid.UUID) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// GetPersonnelByPIN performs a lookup by PIN code
func (r *CheckInRepo) GetPersonnelByPIN(ctx context.Context, pin string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	if err := r.db.WithContext(ctx).Where("pin_code = ?", pin).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// GetLogsForIncident returns all check-in records for a given incident
func (r *CheckInRepo) GetLogsForIncident(ctx context.Context, incidentID uuid.UUID) ([]models.PersonnelIncidentLog, error) {
	var list []models.PersonnelIncidentLog
	err := r.db.WithContext(ctx).Where("incident_id = ?", incidentID).Order("check_in_time DESC").Find(&list).Error
	return list, err
}

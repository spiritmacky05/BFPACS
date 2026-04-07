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

// ErrAlreadyCheckedIn is returned when personnel is already checked in to the incident
var ErrAlreadyCheckedIn = errors.New("personnel is already checked in to this incident")

// IsCheckedIn returns true if the personnel is currently checked in (no check_out_time) for the incident
func (r *CheckInRepo) IsCheckedIn(ctx context.Context, personnelID, incidentID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.PersonnelIncidentLog{}).
		Where("personnel_id = ? AND incident_id = ? AND check_out_time IS NULL", personnelID, incidentID).
		Count(&count).Error
	return count > 0, err
}

// CheckInAtomic performs a check-in within a transaction to prevent TOCTOU race conditions.
// It checks for existing active check-in and creates a new one atomically.
func (r *CheckInRepo) CheckInAtomic(ctx context.Context, personnelID, incidentID uuid.UUID, method string) (*models.PersonnelIncidentLog, error) {
	var result *models.PersonnelIncidentLog

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Lock-free duplicate check within the transaction
		var count int64
		if err := tx.Model(&models.PersonnelIncidentLog{}).
			Where("personnel_id = ? AND incident_id = ? AND check_out_time IS NULL", personnelID, incidentID).
			Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return ErrAlreadyCheckedIn
		}

		incID := incidentID
		perID := personnelID
		logEntry := models.PersonnelIncidentLog{
			IncidentID:    &incID,
			PersonnelID:   &perID,
			CheckInMethod: method,
			EntryType:     method,
		}
		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}

		// Update Responder Status
		// Try updating User table (Responders)
		tx.Model(&models.User{}).Where("id = ?", personnelID).Update("acs_status", "ACS ACTIVATED")
		// Try updating DutyPersonnel table (Legacy/NFC/PIN)
		tx.Model(&models.DutyPersonnel{}).Where("id = ?", personnelID).Update("duty_status", "ACS ACTIVATED")

		result = &logEntry
		return nil
	})

	return result, err
}

// CheckOut sets the check_out_time for an open log entry
func (r *CheckInRepo) CheckOut(ctx context.Context, logID uuid.UUID) error {
	now := time.Now()

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var logEntry models.PersonnelIncidentLog
		if err := tx.Where("id = ?", logID).First(&logEntry).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.PersonnelIncidentLog{}).Where("id = ?", logID).Update("check_out_time", &now).Error; err != nil {
			return err
		}

		if logEntry.PersonnelID != nil {
			tx.Model(&models.User{}).Where("id = ?", *logEntry.PersonnelID).Update("acs_status", "Serviceable")
			tx.Model(&models.DutyPersonnel{}).Where("id = ?", *logEntry.PersonnelID).Update("duty_status", "On Duty")
		}

		return nil
	})
}

// GetUserByID looks up a responder user by UUID from the users table
func (r *CheckInRepo) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
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

// GetAllLogs returns all check-in records (no incident filter), ordered newest first.
// Used by the dashboard to show system-wide today's activity.
func (r *CheckInRepo) GetAllLogs(ctx context.Context) ([]models.PersonnelIncidentLog, error) {
	var list []models.PersonnelIncidentLog
	err := r.db.WithContext(ctx).Order("check_in_time DESC").Limit(1000).Find(&list).Error
	return list, err
}

// CheckOutByID sets check_out_time for the given log entry
func (r *CheckInRepo) CheckOutByID(ctx context.Context, logID uuid.UUID) error {
	now := time.Now()

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var logEntry models.PersonnelIncidentLog
		if err := tx.Where("id = ?", logID).First(&logEntry).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.PersonnelIncidentLog{}).Where("id = ?", logID).Update("check_out_time", &now).Error; err != nil {
			return err
		}

		if logEntry.PersonnelID != nil {
			tx.Model(&models.User{}).Where("id = ?", *logEntry.PersonnelID).Update("acs_status", "Serviceable")
			tx.Model(&models.DutyPersonnel{}).Where("id = ?", *logEntry.PersonnelID).Update("duty_status", "On Duty")
		}

		return nil
	})
}

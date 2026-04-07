package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type CommunityRepo struct {
	db *gorm.DB
}

func NewCommunityRepo(db *gorm.DB) *CommunityRepo {
	return &CommunityRepo{db: db}
}

func (r *CommunityRepo) CreateCommunity(ctx context.Context, fullName, email, passwordHash string, contactNo *string) (*models.Community, error) {
	entry := models.Community{
		FullName:     fullName,
		Email:        email,
		PasswordHash: passwordHash,
		ContactNo:    contactNo,
		IsActive:     true,
	}
	if err := r.db.WithContext(ctx).Create(&entry).Error; err != nil {
		return nil, err
	}
	return &entry, nil
}

func (r *CommunityRepo) GetByEmail(ctx context.Context, email string) (*models.Community, error) {
	var entry models.Community
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&entry).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entry, nil
}

func (r *CommunityRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Community, error) {
	var entry models.Community
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&entry).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entry, nil
}

func (r *CommunityRepo) CreateIncidentReport(ctx context.Context, community *models.Community, req models.CreateCommunityIncidentReportRequest) (*models.CommunityIncidentReport, *models.FireIncident, error) {
	var report models.CommunityIncidentReport
	var incident models.FireIncident

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		incident = models.FireIncident{
			LocationText:     req.LocationText,
			Lat:              req.Lat,
			Lng:              req.Lng,
			DateTimeReported: time.Now(),
			AlarmStatus:      "1st Alarm",
			IncidentStatus:   "Active",
			ResponseType:     "Community Report",
		}
		if err := tx.Create(&incident).Error; err != nil {
			return err
		}

		report = models.CommunityIncidentReport{
			IncidentID:   incident.ID,
			CommunityID:  community.ID,
			ReporterName: community.FullName,
			Description:  req.Description,
			LocationText: req.LocationText,
			Lat:          req.Lat,
			Lng:          req.Lng,
			MediaDataURL: req.MediaDataURL,
			MediaType:    req.MediaType,
			MapURL:       req.MapURL,
		}

		if err := tx.Create(&report).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return &report, &incident, nil
}

func (r *CommunityRepo) ListReportsByIncident(ctx context.Context, incidentID uuid.UUID) ([]models.CommunityIncidentReport, error) {
	var list []models.CommunityIncidentReport
	err := r.db.WithContext(ctx).
		Where("incident_id = ?", incidentID).
		Order("created_at DESC").
		Find(&list).Error
	return list, err
}

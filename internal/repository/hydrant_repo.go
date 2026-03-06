package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type HydrantRepo struct {
	db *gorm.DB
}

func NewHydrantRepo(db *gorm.DB) *HydrantRepo {
	return &HydrantRepo{db: db}
}

func (r *HydrantRepo) GetAll(ctx context.Context) ([]models.Hydrant, error) {
	var list []models.Hydrant
	err := r.db.WithContext(ctx).Order("hydrant_code").Find(&list).Error
	return list, err
}

func (r *HydrantRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Hydrant, error) {
	var h models.Hydrant
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&h).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &h, nil
}

func (r *HydrantRepo) GetNearby(ctx context.Context, lat, lng float64, radiusMeters float64) ([]models.NearbyHydrant, error) {
	query := `
		SELECT *, (
			6371000 * acos(
				cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
				sin(radians(?)) * sin(radians(lat))
			)
		) AS distance_meters
		FROM hydrants
		WHERE (
			6371000 * acos(
				cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
				sin(radians(?)) * sin(radians(lat))
			)
		) <= ? AND lat IS NOT NULL AND lng IS NOT NULL
		ORDER BY distance_meters
	`
	var list []models.NearbyHydrant
	err := r.db.WithContext(ctx).Raw(query, lat, lng, lat, lat, lng, lat, radiusMeters).Scan(&list).Error
	return list, err
}

func (r *HydrantRepo) Create(ctx context.Context, req models.CreateHydrantRequest) (*models.Hydrant, error) {
	status := req.Status
	if status == "" {
		status = "Serviceable"
	}
	lat := req.Lat
	lng := req.Lng
	h := models.Hydrant{
		StationID:   req.StationID,
		HydrantCode: req.HydrantCode,
		AddressText: req.AddressText,
		City:        req.City,
		District:    req.District,
		Region:      req.Region,
		Status:      status,
		Lat:         &lat,
		Lng:         &lng,
	}
	if err := r.db.WithContext(ctx).Create(&h).Error; err != nil {
		return nil, err
	}
	return &h, nil
}

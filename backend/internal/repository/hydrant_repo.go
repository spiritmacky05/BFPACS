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
	err := r.db.WithContext(ctx).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *HydrantRepo) GetByStation(ctx context.Context, stationID uuid.UUID) ([]models.Hydrant, error) {
	var list []models.Hydrant
	err := r.db.WithContext(ctx).Where("station_id = ?", stationID).Order("created_at DESC").Find(&list).Error
	return list, err
}

// GetByStationOrGlobal returns hydrants belonging to the given station
// OR hydrants with no station (created by admin, visible to all).
func (r *HydrantRepo) GetByStationOrGlobal(ctx context.Context, stationID uuid.UUID) ([]models.Hydrant, error) {
	var list []models.Hydrant
	err := r.db.WithContext(ctx).Where("station_id = ? OR station_id IS NULL", stationID).Order("created_at DESC").Find(&list).Error
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
		StationID:          req.StationID,
		AddressText:        req.AddressText,
		City:               req.City,
		District:           req.District,
		Region:             req.Region,
		Status:             status,
		Lat:                &lat,
		Lng:                &lng,
		HydrantType:        req.HydrantType,
		PSI:                req.PSI,
		LastInspectionDate: req.LastInspectionDate,
	}
	if err := r.db.WithContext(ctx).Create(&h).Error; err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HydrantRepo) Update(ctx context.Context, id uuid.UUID, req models.UpdateHydrantRequest) (*models.Hydrant, error) {
	updates := map[string]interface{}{}
	if req.AddressText != nil {
		updates["address_text"] = *req.AddressText
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Lat != nil {
		updates["lat"] = *req.Lat
	}
	if req.Lng != nil {
		updates["lng"] = *req.Lng
	}
	if req.HydrantType != nil {
		updates["hydrant_type"] = *req.HydrantType
	}
	if req.PSI != nil {
		updates["psi"] = *req.PSI
	}
	if req.LastInspectionDate != nil {
		updates["last_inspection_date"] = *req.LastInspectionDate
	}
	if req.City != nil {
		updates["city"] = *req.City
	}
	if req.District != nil {
		updates["district"] = *req.District
	}
	if req.Region != nil {
		updates["region"] = *req.Region
	}
	if len(updates) == 0 {
		return r.GetByID(ctx, id)
	}
	res := r.db.WithContext(ctx).Model(&models.Hydrant{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, nil
	}
	return r.GetByID(ctx, id)
}

func (r *HydrantRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Hydrant{}).Error
}

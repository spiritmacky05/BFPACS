package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type StationRepo struct {
	db *gorm.DB
}

func NewStationRepo(db *gorm.DB) *StationRepo {
	return &StationRepo{db: db}
}

func (r *StationRepo) GetAll(ctx context.Context) ([]models.Station, error) {
	var list []models.Station
	err := r.db.WithContext(ctx).Order("station_name").Find(&list).Error
	return list, err
}

func (r *StationRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Station, error) {
	var s models.Station
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&s).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *StationRepo) Create(ctx context.Context, req models.CreateStationRequest) (*models.Station, error) {
	s := models.Station{
		StationName:       req.StationName,
		ContactNumber:     req.ContactNumber,
		TeamLeaderContact: req.TeamLeaderContact,
		AddressText:       req.AddressText,
		City:              req.City,
		District:          req.District,
		Region:            req.Region,
		Lat:               req.Lat,
		Lng:               req.Lng,
	}
	if err := r.db.WithContext(ctx).Create(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StationRepo) Update(ctx context.Context, id uuid.UUID, req models.CreateStationRequest) (*models.Station, error) {
	updates := map[string]interface{}{
		"station_name":        req.StationName,
		"contact_number":      req.ContactNumber,
		"team_leader_contact": req.TeamLeaderContact,
		"address_text":        req.AddressText,
		"city":                req.City,
		"district":            req.District,
		"region":              req.Region,
		"lat":                 req.Lat,
		"lng":                 req.Lng,
	}
	if err := r.db.WithContext(ctx).Model(&models.Station{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	var s models.Station
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StationRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Station{}, id).Error
}

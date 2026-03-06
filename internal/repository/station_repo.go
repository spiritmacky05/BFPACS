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

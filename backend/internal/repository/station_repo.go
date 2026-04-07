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
	list := make([]models.Station, 0)
	err := r.db.WithContext(ctx).
		Raw(`
			SELECT
				s.id,
				s.station_name,
				COALESCE(
					NULLIF(s.contact_number, ''),
					NULLIF((
						SELECT u.station_contact_number
						FROM users u
						WHERE u.station_id = s.id
							AND u.station_contact_number IS NOT NULL
							AND u.station_contact_number <> ''
						ORDER BY u.updated_at DESC
						LIMIT 1
					), ''),
					NULLIF(s.team_leader_contact, '')
				) AS contact_number,
				s.team_leader_contact,
				s.address_text,
				s.city,
				s.district,
				s.region,
				s.lat,
				s.lng,
				s.created_at,
				s.updated_at
			FROM stations s
			ORDER BY s.station_name
		`).
		Scan(&list).Error
	return list, err
}

func (r *StationRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Station, error) {
	var s models.Station
	if err := r.db.WithContext(ctx).
		Raw(`
			SELECT
				s.id,
				s.station_name,
				COALESCE(
					NULLIF(s.contact_number, ''),
					NULLIF((
						SELECT u.station_contact_number
						FROM users u
						WHERE u.station_id = s.id
							AND u.station_contact_number IS NOT NULL
							AND u.station_contact_number <> ''
						ORDER BY u.updated_at DESC
						LIMIT 1
					), ''),
					NULLIF(s.team_leader_contact, '')
				) AS contact_number,
				s.team_leader_contact,
				s.address_text,
				s.city,
				s.district,
				s.region,
				s.lat,
				s.lng,
				s.created_at,
				s.updated_at
			FROM stations s
			WHERE s.id = ?
			LIMIT 1
		`, id).
		Scan(&s).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	if s.ID == uuid.Nil {
		return nil, nil
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

package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type PersonnelRepo struct {
	db *gorm.DB
}

func NewPersonnelRepo(db *gorm.DB) *PersonnelRepo {
	return &PersonnelRepo{db: db}
}

func (r *PersonnelRepo) GetAll(ctx context.Context) ([]models.DutyPersonnel, error) {
	var list []models.DutyPersonnel
	err := r.db.WithContext(ctx).Preload("Station").Order("full_name").Find(&list).Error
	return list, err
}

func (r *PersonnelRepo) GetByStation(ctx context.Context, stationID uuid.UUID) ([]models.DutyPersonnel, error) {
	var list []models.DutyPersonnel
	err := r.db.WithContext(ctx).Preload("Station").Where("station_id = ?", stationID).Order("full_name").Find(&list).Error
	return list, err
}

func (r *PersonnelRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	if err := r.db.WithContext(ctx).Preload("Station").Where("id = ?", id).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *PersonnelRepo) GetByNFCTag(ctx context.Context, tagID string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	if err := r.db.WithContext(ctx).Where("nfc_tag_id = ?", tagID).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *PersonnelRepo) GetByPIN(ctx context.Context, pin string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	if err := r.db.WithContext(ctx).Where("pin_code = ?", pin).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *PersonnelRepo) Create(ctx context.Context, req models.CreatePersonnelRequest) (*models.DutyPersonnel, error) {
	dutyStatus := req.DutyStatus
	if dutyStatus == "" {
		dutyStatus = "Off Duty"
	}
	p := models.DutyPersonnel{
		StationID:          req.StationID,
		FleetID:            req.FleetID,
		FullName:           req.FullName,
		Rank:               req.Rank,
		Designation:        req.Designation,
		Shift:              req.Shift,
		DutyStatus:         dutyStatus,
		IsStationCommander: req.IsStationCommander,
		NFCTagID:           req.NFCTagID,
		PinCode:            req.PinCode,
	}
	if err := r.db.WithContext(ctx).Create(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PersonnelRepo) UpdateDutyStatus(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Model(&models.DutyPersonnel{}).Where("id = ?", id).Update("duty_status", status).Error
}

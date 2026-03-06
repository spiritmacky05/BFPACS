package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type FleetRepo struct {
	db *gorm.DB
}

func NewFleetRepo(db *gorm.DB) *FleetRepo {
	return &FleetRepo{db: db}
}

func (r *FleetRepo) GetAll(ctx context.Context) ([]models.Fleet, error) {
	var list []models.Fleet
	err := r.db.WithContext(ctx).Order("engine_code").Find(&list).Error
	return list, err
}

func (r *FleetRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Fleet, error) {
	var f models.Fleet
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&f).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &f, nil
}

func (r *FleetRepo) Create(ctx context.Context, req models.CreateFleetRequest) (*models.Fleet, error) {
	status := req.Status
	if status == "" {
		status = "Serviceable"
	}
	acsStatus := req.ACSStatus
	if acsStatus == "" {
		acsStatus = "Inactive"
	}

	f := models.Fleet{
		StationID:   req.StationID,
		UserID:      req.UserID,
		EngineCode:  req.EngineCode,
		PlateNumber: req.PlateNumber,
		VehicleType: req.VehicleType,
		FTCapacity:  req.FTCapacity,
		Status:      status,
		ACSStatus:   acsStatus,
	}

	if err := r.db.WithContext(ctx).Create(&f).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FleetRepo) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Fleet, error) {
	res := r.db.WithContext(ctx).Model(&models.Fleet{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, nil
	}
	var f models.Fleet
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&f).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FleetRepo) UpdateLocation(ctx context.Context, id uuid.UUID, lat, lng float64) error {
	return r.db.WithContext(ctx).Model(&models.Fleet{}).Where("id = ?", id).Updates(map[string]interface{}{"lat": lat, "lng": lng}).Error
}

func (r *FleetRepo) LogMovement(ctx context.Context, fleetID uuid.UUID, req models.LogMovementRequest) (*models.FleetMovementLog, error) {
	log := models.FleetMovementLog{
		DispatchID:      req.DispatchID,
		FleetID:         &fleetID,
		StatusCode:      req.StatusCode,
		Lat:             req.Lat,
		Lng:             req.Lng,
		BatteryLevel:    req.BatteryLevel,
		Heading:         req.Heading,
		Purpose:         req.Purpose,
		DestinationText: req.DestinationText,
		OdometerReading: req.OdometerReading,
	}
	if err := r.db.WithContext(ctx).Create(&log).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *FleetRepo) GetMovementLogs(ctx context.Context, fleetID uuid.UUID) ([]models.FleetMovementLog, error) {
	var list []models.FleetMovementLog
	err := r.db.WithContext(ctx).Where("fleet_id = ?", fleetID).Order("recorded_at DESC").Find(&list).Error
	return list, err
}

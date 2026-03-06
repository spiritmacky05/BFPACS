package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type EquipmentRepo struct {
	db *gorm.DB
}

func NewEquipmentRepo(db *gorm.DB) *EquipmentRepo {
	return &EquipmentRepo{db: db}
}

func (r *EquipmentRepo) GetAll(ctx context.Context) ([]models.LogisticalEquipment, error) {
	var list []models.LogisticalEquipment
	err := r.db.WithContext(ctx).Order("equipment_name").Find(&list).Error
	return list, err
}

func (r *EquipmentRepo) GetByStation(ctx context.Context, stationID uuid.UUID) ([]models.LogisticalEquipment, error) {
	var list []models.LogisticalEquipment
	err := r.db.WithContext(ctx).Where("station_id = ?", stationID).Order("equipment_name").Find(&list).Error
	return list, err
}

func (r *EquipmentRepo) Create(ctx context.Context, req models.CreateEquipmentRequest) (*models.LogisticalEquipment, error) {
	status := req.Status
	if status == "" {
		status = "Serviceable"
	}
	qty := req.Quantity
	if qty == 0 {
		qty = 1
	}
	e := models.LogisticalEquipment{
		StationID:     req.StationID,
		FleetID:       req.FleetID,
		EquipmentName: req.EquipmentName,
		Quantity:      qty,
		Status:        status,
	}
	if err := r.db.WithContext(ctx).Create(&e).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EquipmentRepo) BorrowItem(ctx context.Context, id uuid.UUID, req models.BorrowEquipmentRequest) error {
	now := time.Now()
	updates := map[string]interface{}{
		"borrower_name": req.BorrowerName,
		"borrowed_at":   &now,
		"status":        "Borrowed",
	}
	return r.db.WithContext(ctx).Model(&models.LogisticalEquipment{}).Where("id = ?", id).Updates(updates).Error
}

func (r *EquipmentRepo) ReturnItem(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	updates := map[string]interface{}{
		"returned_at":   &now,
		"status":        "Serviceable",
		"borrower_name": nil,
	}
	return r.db.WithContext(ctx).Model(&models.LogisticalEquipment{}).Where("id = ?", id).Updates(updates).Error
}

func (r *EquipmentRepo) Update(ctx context.Context, id uuid.UUID, req models.UpdateEquipmentRequest) error {
	updates := map[string]interface{}{
		"equipment_name": req.EquipmentName,
		"quantity":       req.Quantity,
		"status":         req.Status,
	}
	if req.BorrowerName != nil {
		updates["borrower_name"] = *req.BorrowerName
	}
	return r.db.WithContext(ctx).Model(&models.LogisticalEquipment{}).Where("id = ?", id).Updates(updates).Error
}

func (r *EquipmentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.LogisticalEquipment{}, id).Error
}

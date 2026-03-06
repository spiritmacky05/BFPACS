package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// EquipmentRepo handles logistical_equipment table
type EquipmentRepo struct {
	Pool *pgxpool.Pool
}

func NewEquipmentRepo(pool *pgxpool.Pool) *EquipmentRepo {
	return &EquipmentRepo{Pool: pool}
}

func (r *EquipmentRepo) GetAll(ctx context.Context) ([]models.LogisticalEquipment, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, station_id, fleet_id, equipment_name, quantity, status,
		       borrower_name, borrowed_at, returned_at, created_at, updated_at
		FROM logistical_equipment ORDER BY equipment_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanEquipmentRows(rows)
}

func (r *EquipmentRepo) GetByStation(ctx context.Context, stationID uuid.UUID) ([]models.LogisticalEquipment, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, station_id, fleet_id, equipment_name, quantity, status,
		       borrower_name, borrowed_at, returned_at, created_at, updated_at
		FROM logistical_equipment WHERE station_id=$1 ORDER BY equipment_name`, stationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanEquipmentRows(rows)
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
	var e models.LogisticalEquipment
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO logistical_equipment (station_id, fleet_id, equipment_name, quantity, status)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, station_id, fleet_id, equipment_name, quantity, status,
		          borrower_name, borrowed_at, returned_at, created_at, updated_at`,
		req.StationID, req.FleetID, req.EquipmentName, qty, status).Scan(
		&e.ID, &e.StationID, &e.FleetID, &e.EquipmentName, &e.Quantity, &e.Status,
		&e.BorrowerName, &e.BorrowedAt, &e.ReturnedAt, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EquipmentRepo) BorrowItem(ctx context.Context, id uuid.UUID, req models.BorrowEquipmentRequest) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE logistical_equipment
		SET borrower_name=$1, borrowed_at=NOW(), status='Borrowed', updated_at=NOW()
		WHERE id=$2`, req.BorrowerName, id)
	return err
}

func (r *EquipmentRepo) ReturnItem(ctx context.Context, id uuid.UUID) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE logistical_equipment
		SET returned_at=NOW(), status='Serviceable', borrower_name=NULL, updated_at=NOW()
		WHERE id=$1`, id)
	return err
}

func (r *EquipmentRepo) Update(ctx context.Context, id uuid.UUID, req models.UpdateEquipmentRequest) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE logistical_equipment
		SET equipment_name=$1, quantity=$2, status=$3, borrower_name=$4, updated_at=NOW()
		WHERE id=$5`, req.EquipmentName, req.Quantity, req.Status, req.BorrowerName, id)
	return err
}

func (r *EquipmentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.Pool.Exec(ctx, `
		DELETE FROM logistical_equipment
		WHERE id=$1`, id)
	return err
}

func scanEquipmentRows(rows interface {
	Next() bool
	Scan(dest ...any) error
}) ([]models.LogisticalEquipment, error) {
	var list []models.LogisticalEquipment
	for rows.Next() {
		var e models.LogisticalEquipment
		if err := rows.Scan(&e.ID, &e.StationID, &e.FleetID, &e.EquipmentName, &e.Quantity, &e.Status,
			&e.BorrowerName, &e.BorrowedAt, &e.ReturnedAt, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

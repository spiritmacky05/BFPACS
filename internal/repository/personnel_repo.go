package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// PersonnelRepo handles all DB ops for duty_personnel
type PersonnelRepo struct {
	Pool *pgxpool.Pool
}

func NewPersonnelRepo(pool *pgxpool.Pool) *PersonnelRepo {
	return &PersonnelRepo{Pool: pool}
}

func (r *PersonnelRepo) GetAll(ctx context.Context) ([]models.DutyPersonnel, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel
		ORDER BY full_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.DutyPersonnel
	for rows.Next() {
		var p models.DutyPersonnel
		if err := rows.Scan(&p.ID, &p.StationID, &p.FleetID, &p.FullName, &p.Rank,
			&p.Designation, &p.Shift, &p.DutyStatus, &p.IsStationCommander,
			&p.NFCTagID, &p.PinCode, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *PersonnelRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	err := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel WHERE id = $1`, id).Scan(
		&p.ID, &p.StationID, &p.FleetID, &p.FullName, &p.Rank,
		&p.Designation, &p.Shift, &p.DutyStatus, &p.IsStationCommander,
		&p.NFCTagID, &p.PinCode, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// GetByNFCTag performs a fast, indexed lookup by the unique nfc_tag_id column
func (r *PersonnelRepo) GetByNFCTag(ctx context.Context, tagID string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	err := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel WHERE nfc_tag_id = $1`, tagID).Scan(
		&p.ID, &p.StationID, &p.FleetID, &p.FullName, &p.Rank,
		&p.Designation, &p.Shift, &p.DutyStatus, &p.IsStationCommander,
		&p.NFCTagID, &p.PinCode, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// GetByPIN looks up a personnel record by PIN code
func (r *PersonnelRepo) GetByPIN(ctx context.Context, pin string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	err := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel WHERE pin_code = $1`, pin).Scan(
		&p.ID, &p.StationID, &p.FleetID, &p.FullName, &p.Rank,
		&p.Designation, &p.Shift, &p.DutyStatus, &p.IsStationCommander,
		&p.NFCTagID, &p.PinCode, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *PersonnelRepo) Create(ctx context.Context, req models.CreatePersonnelRequest) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	dutyStatus := req.DutyStatus
	if dutyStatus == "" {
		dutyStatus = "Off Duty"
	}
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO duty_personnel (station_id, fleet_id, full_name, rank, designation, shift,
		                            duty_status, is_station_commander, nfc_tag_id, pin_code)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING id, station_id, fleet_id, full_name, rank, designation, shift,
		          duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at`,
		req.StationID, req.FleetID, req.FullName, req.Rank, req.Designation, req.Shift,
		dutyStatus, req.IsStationCommander, req.NFCTagID, req.PinCode).Scan(
		&p.ID, &p.StationID, &p.FleetID, &p.FullName, &p.Rank,
		&p.Designation, &p.Shift, &p.DutyStatus, &p.IsStationCommander,
		&p.NFCTagID, &p.PinCode, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PersonnelRepo) UpdateDutyStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.Pool.Exec(ctx,
		`UPDATE duty_personnel SET duty_status=$1, updated_at=NOW() WHERE id=$2`, status, id)
	return err
}

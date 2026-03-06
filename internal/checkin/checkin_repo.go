package checkin

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// CheckInRepo handles personnel_incident_logs for NFC/PIN check-ins
type CheckInRepo struct {
	Pool *pgxpool.Pool
}

func NewCheckInRepo(pool *pgxpool.Pool) *CheckInRepo {
	return &CheckInRepo{Pool: pool}
}

// IsCheckedIn returns true if the personnel is currently checked in (no check_out_time) for the incident
func (r *CheckInRepo) IsCheckedIn(ctx context.Context, personnelID, incidentID uuid.UUID) (bool, error) {
	var count int
	err := r.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM personnel_incident_logs
		WHERE personnel_id=$1 AND incident_id=$2 AND check_out_time IS NULL`,
		personnelID, incidentID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CheckIn inserts a new check-in log entry for a personnel member
func (r *CheckInRepo) CheckIn(ctx context.Context, personnelID, incidentID uuid.UUID, method string) (*models.PersonnelIncidentLog, error) {
	var log models.PersonnelIncidentLog
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO personnel_incident_logs (incident_id, personnel_id, check_in_method, entry_type)
		VALUES ($1,$2,$3,$3)
		RETURNING id, incident_id, personnel_id, check_in_method, check_in_time, check_out_time, entry_type`,
		incidentID, personnelID, method).Scan(
		&log.ID, &log.IncidentID, &log.PersonnelID,
		&log.CheckInMethod, &log.CheckInTime, &log.CheckOutTime, &log.EntryType)
	if err != nil {
		return nil, err
	}
	return &log, nil
}

// CheckOut sets the check_out_time for an open log entry
func (r *CheckInRepo) CheckOut(ctx context.Context, logID uuid.UUID) error {
	_, err := r.Pool.Exec(ctx, `
		UPDATE personnel_incident_logs SET check_out_time=NOW() WHERE id=$1`, logID)
	return err
}

// GetPersonnelByNFCTag performs an indexed lookup on nfc_tag_id
func (r *CheckInRepo) GetPersonnelByNFCTag(ctx context.Context, tagID string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	err := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel WHERE nfc_tag_id=$1`, tagID).Scan(
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

// GetPersonnelByID looks up a duty personnel record by UUID
func (r *CheckInRepo) GetPersonnelByID(ctx context.Context, id uuid.UUID) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	err := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel WHERE id=$1`, id).Scan(
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

// GetPersonnelByPIN performs a lookup by PIN code
func (r *CheckInRepo) GetPersonnelByPIN(ctx context.Context, pin string) (*models.DutyPersonnel, error) {
	var p models.DutyPersonnel
	err := r.Pool.QueryRow(ctx, `
		SELECT id, station_id, fleet_id, full_name, rank, designation, shift,
		       duty_status, is_station_commander, nfc_tag_id, pin_code, created_at, updated_at
		FROM duty_personnel WHERE pin_code=$1`, pin).Scan(
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

// GetLogsForIncident returns all check-in records for a given incident
func (r *CheckInRepo) GetLogsForIncident(ctx context.Context, incidentID uuid.UUID) ([]models.PersonnelIncidentLog, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, incident_id, personnel_id, check_in_method, check_in_time, check_out_time, entry_type
		FROM personnel_incident_logs WHERE incident_id=$1 ORDER BY check_in_time DESC`, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.PersonnelIncidentLog
	for rows.Next() {
		var l models.PersonnelIncidentLog
		if err := rows.Scan(&l.ID, &l.IncidentID, &l.PersonnelID,
			&l.CheckInMethod, &l.CheckInTime, &l.CheckOutTime, &l.EntryType); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, nil
}

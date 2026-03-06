package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// StationRepo handles the stations table
type StationRepo struct {
	Pool *pgxpool.Pool
}

func NewStationRepo(pool *pgxpool.Pool) *StationRepo {
	return &StationRepo{Pool: pool}
}

const stationSelectFields = `
	id, station_name, contact_number, team_leader_contact, address_text,
	city, district, region,
	ST_Y(location::geometry) AS lat,
	ST_X(location::geometry) AS lng,
	created_at, updated_at`

func scanStation(row pgx.Row) (*models.Station, error) {
	var s models.Station
	err := row.Scan(&s.ID, &s.StationName, &s.ContactNumber, &s.TeamLeaderContact, &s.AddressText,
		&s.City, &s.District, &s.Region, &s.Lat, &s.Lng, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StationRepo) GetAll(ctx context.Context) ([]models.Station, error) {
	rows, err := r.Pool.Query(ctx, `SELECT `+stationSelectFields+` FROM stations ORDER BY station_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Station
	for rows.Next() {
		var s models.Station
		if err := rows.Scan(&s.ID, &s.StationName, &s.ContactNumber, &s.TeamLeaderContact, &s.AddressText,
			&s.City, &s.District, &s.Region, &s.Lat, &s.Lng, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *StationRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Station, error) {
	row := r.Pool.QueryRow(ctx, `SELECT `+stationSelectFields+` FROM stations WHERE id=$1`, id)
	s, err := scanStation(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return s, nil
}

func (r *StationRepo) Create(ctx context.Context, req models.CreateStationRequest) (*models.Station, error) {
	row := r.Pool.QueryRow(ctx, `
		INSERT INTO stations (station_name, contact_number, team_leader_contact, address_text,
		                      city, district, region, location)
		VALUES ($1,$2,$3,$4,$5,$6,$7,
		        CASE WHEN $8::float8 IS NOT NULL AND $9::float8 IS NOT NULL
		             THEN ST_MakePoint($9,$8)::geography ELSE NULL END)
		RETURNING `+stationSelectFields,
		req.StationName, req.ContactNumber, req.TeamLeaderContact, req.AddressText,
		req.City, req.District, req.Region, req.Lat, req.Lng)
	return scanStation(row)
}

package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// HydrantRepo handles all DB ops for hydrants
type HydrantRepo struct {
	Pool *pgxpool.Pool
}

func NewHydrantRepo(pool *pgxpool.Pool) *HydrantRepo {
	return &HydrantRepo{Pool: pool}
}

const hydrantSelectFields = `
	id, station_id, hydrant_code, address_text, city, status,
	ST_Y(location::geometry) AS lat,
	ST_X(location::geometry) AS lng,
	district, region, created_at, updated_at`

func scanHydrant(row pgx.Row) (*models.Hydrant, error) {
	var h models.Hydrant
	err := row.Scan(&h.ID, &h.StationID, &h.HydrantCode, &h.AddressText, &h.City, &h.Status,
		&h.Lat, &h.Lng, &h.District, &h.Region, &h.CreatedAt, &h.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HydrantRepo) GetAll(ctx context.Context) ([]models.Hydrant, error) {
	rows, err := r.Pool.Query(ctx, `SELECT `+hydrantSelectFields+` FROM hydrants ORDER BY hydrant_code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Hydrant
	for rows.Next() {
		var h models.Hydrant
		if err := rows.Scan(&h.ID, &h.StationID, &h.HydrantCode, &h.AddressText, &h.City, &h.Status,
			&h.Lat, &h.Lng, &h.District, &h.Region, &h.CreatedAt, &h.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, nil
}

func (r *HydrantRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Hydrant, error) {
	row := r.Pool.QueryRow(ctx, `SELECT `+hydrantSelectFields+` FROM hydrants WHERE id=$1`, id)
	h, err := scanHydrant(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return h, nil
}

// GetNearby uses PostGIS ST_DWithin for efficient radial search against the GiST index
func (r *HydrantRepo) GetNearby(ctx context.Context, lat, lng float64, radiusMeters float64) ([]models.NearbyHydrant, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, station_id, hydrant_code, address_text, city, status,
		       ST_Y(location::geometry) AS lat,
		       ST_X(location::geometry) AS lng,
		       district, region, created_at, updated_at,
		       ST_Distance(location, ST_MakePoint($1,$2)::geography) AS distance_meters
		FROM hydrants
		WHERE ST_DWithin(location, ST_MakePoint($1,$2)::geography, $3)
		ORDER BY distance_meters`, lng, lat, radiusMeters)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NearbyHydrant
	for rows.Next() {
		var h models.NearbyHydrant
		if err := rows.Scan(&h.ID, &h.StationID, &h.HydrantCode, &h.AddressText, &h.City, &h.Status,
			&h.Lat, &h.Lng, &h.District, &h.Region, &h.CreatedAt, &h.UpdatedAt,
			&h.DistanceMeters); err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, nil
}

func (r *HydrantRepo) Create(ctx context.Context, req models.CreateHydrantRequest) (*models.Hydrant, error) {
	status := req.Status
	if status == "" {
		status = "Serviceable"
	}
	row := r.Pool.QueryRow(ctx, `
		INSERT INTO hydrants (station_id, hydrant_code, address_text, city, status,
		                      location, district, region)
		VALUES ($1,$2,$3,$4,$5, ST_MakePoint($7,$6)::geography, $8,$9)
		RETURNING `+hydrantSelectFields,
		req.StationID, req.HydrantCode, req.AddressText, req.City, status,
		req.Lat, req.Lng, req.District, req.Region)
	return scanHydrant(row)
}

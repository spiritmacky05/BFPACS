package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

// CreateUser maps exactly to public.users but includes password_hash
func (r *UserRepo) CreateUser(ctx context.Context, email, fullName, passwordHash, role string, stationID *uuid.UUID) (*models.User, error) {
	query := `
		INSERT INTO users (email, full_name, password_hash, role, station_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, full_name, station_id, role, is_active, created_at, updated_at
	`
	var u models.User
	err := r.db.QueryRow(ctx, query, email, fullName, passwordHash, role, stationID).Scan(
		&u.ID, &u.Email, &u.FullName, &u.StationID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByEmail returns the user and their password hash for verification
func (r *UserRepo) GetUserByEmail(ctx context.Context, email string) (*models.User, string, error) {
	query := `
		SELECT id, email, full_name, station_id, role, is_active, created_at, updated_at, password_hash
		FROM users
		WHERE email = $1
	`
	var u models.User
	var hash string
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.FullName, &u.StationID, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt, &hash,
	)
	if err != nil {
		return nil, "", err
	}
	return &u, hash, nil
}

package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) CreateUser(ctx context.Context, email, fullName, passwordHash, role string, stationID *uuid.UUID) (*models.User, error) {
	u := models.User{
		Email:        email,
		FullName:     fullName,
		PasswordHash: passwordHash,
		Role:         role,
		StationID:    stationID,
		Approved:     false,
	}
	if err := r.db.WithContext(ctx).Create(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetUserByEmail(ctx context.Context, email string) (*models.User, string, error) {
	var u models.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("user not found")
		}
		return nil, "", err
	}
	return &u, u.PasswordHash, nil
}

func (r *UserRepo) GetAll(ctx context.Context) ([]models.User, error) {
	var users []models.User
	err := r.db.WithContext(ctx).Order("created_at DESC").Find(&users).Error
	return users, err
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) UpdateUser(ctx context.Context, id uuid.UUID, req models.UpdateUserRequest) (*models.User, error) {
	updates := map[string]interface{}{}

	if req.Role != nil {
		updates["role"] = *req.Role
	}
	if req.Approved != nil {
		updates["approved"] = *req.Approved
	}
	if req.UserType != nil {
		updates["user_type"] = *req.UserType
	}
	if req.SubRole != nil {
		updates["sub_role"] = *req.SubRole
	}
	if req.PersonnelType != nil {
		updates["personnel_type"] = *req.PersonnelType
	}
	if req.TypeOfVehicle != nil {
		updates["type_of_vehicle"] = *req.TypeOfVehicle
	}
	if req.EngineNumber != nil {
		updates["engine_number"] = *req.EngineNumber
	}
	if req.PlateNumber != nil {
		updates["plate_number"] = *req.PlateNumber
	}
	if req.FireTruckCapacity != nil {
		updates["fire_truck_capacity"] = *req.FireTruckCapacity
	}
	if req.CityFireMarshal != nil {
		updates["city_fire_marshal"] = *req.CityFireMarshal
	}
	if req.StationCommander != nil {
		updates["station_commander"] = *req.StationCommander
	}
	if req.StationContactNumber != nil {
		updates["station_contact_number"] = *req.StationContactNumber
	}
	if req.ACSStatus != nil {
		updates["acs_status"] = *req.ACSStatus
	}
	if req.StationID != nil {
		if *req.StationID == "" {
			updates["station_id"] = nil
		} else {
			sid, err := uuid.Parse(*req.StationID)
			if err == nil {
				updates["station_id"] = sid
			}
		}
	}

	if len(updates) == 0 {
		return r.GetByID(ctx, id)
	}

	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

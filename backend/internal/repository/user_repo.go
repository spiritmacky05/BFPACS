package repository

import (
	"context"
	"errors"
	"strings"

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
	if err := r.db.WithContext(ctx).Where("email = ?", strings.ToLower(strings.TrimSpace(email))).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("user not found")
		}
		return nil, "", err
	}
	return &u, u.PasswordHash, nil
}

func (r *UserRepo) EmailExists(ctx context.Context, email string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.User{}).
		Where("email = ?", strings.ToLower(strings.TrimSpace(email))).
		Count(&count).Error
	return count > 0, err
}

func (r *UserRepo) CreateUserWithStation(ctx context.Context, req models.RegisterRequest, passwordHash string) (*models.User, error) {
	var created models.User

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		station := models.Station{
			StationName: req.FullName,
			City:        req.City,
			District:    req.District,
			Region:      req.Region,
			AddressText: req.AddressText,
		}

		if err := tx.Create(&station).Error; err != nil {
			return err
		}

		user := models.User{
			Email:        strings.ToLower(strings.TrimSpace(req.Email)),
			FullName:     req.FullName,
			PasswordHash: passwordHash,
			Role:         "user",
			StationID:    &station.ID,
			Approved:     false,
		}

		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		created = user
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &created, nil
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

	if req.FullName != nil {
		updates["full_name"] = *req.FullName
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}
	if req.Approved != nil {
		updates["approved"] = *req.Approved
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.UserType != nil {
		updates["user_type"] = *req.UserType
	}
	if req.SubUserRole != nil {
		updates["sub_role"] = *req.SubUserRole
	}
	if req.AgencyRole != nil {
		updates["personnel_type"] = *req.AgencyRole
	}
	if req.BfpType != nil {
		updates["bfp_type"] = *req.BfpType
	}
	if req.ManagerRank != nil {
		updates["manager_rank"] = *req.ManagerRank
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

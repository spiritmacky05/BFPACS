package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type DeploymentRepo struct {
	db *gorm.DB
}

func NewDeploymentRepo(db *gorm.DB) *DeploymentRepo {
	return &DeploymentRepo{db: db}
}

func (r *DeploymentRepo) GetAll(ctx context.Context) ([]models.Deployment, error) {
	var list []models.Deployment
	err := r.db.WithContext(ctx).Order("start_time DESC").Find(&list).Error
	return list, err
}

func (r *DeploymentRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Deployment, error) {
	var d models.Deployment
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&d).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *DeploymentRepo) Create(ctx context.Context, req models.CreateDeploymentRequest) (*models.Deployment, error) {
	status := "Active"
	d := models.Deployment{
		NameOfDeployment: req.NameOfDeployment,
		LocationText:     req.LocationText,
		Lat:              req.Lat,
		Lng:              req.Lng,
		Status:           status,
		TeamLeader:       req.TeamLeader,
		Remarks:          req.Remarks,
	}
	if err := r.db.WithContext(ctx).Create(&d).Error; err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *DeploymentRepo) AssignFleet(ctx context.Context, deploymentID uuid.UUID, req models.AssignFleetToDeploymentRequest) (*models.DeploymentAssignment, error) {
	fleetID := req.FleetID
	depID := deploymentID
	a := models.DeploymentAssignment{
		DeploymentID: &depID,
		FleetID:      &fleetID,
	}
	if err := r.db.WithContext(ctx).Create(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *DeploymentRepo) GetAssignments(ctx context.Context, deploymentID uuid.UUID) ([]models.DeploymentAssignment, error) {
	var list []models.DeploymentAssignment
	err := r.db.WithContext(ctx).Where("deployment_id = ?", deploymentID).Order("check_in_time").Find(&list).Error
	return list, err
}

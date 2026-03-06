package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/gorm"
)

type ReportRepo struct {
	db *gorm.DB
}

func NewReportRepo(db *gorm.DB) *ReportRepo {
	return &ReportRepo{db: db}
}

func (r *ReportRepo) Create(ctx context.Context, req models.CreateReportRequest) (*models.SituationalReport, error) {
	reportType := req.ReportType
	if reportType == "" {
		reportType = "Situational"
	}
	s := models.SituationalReport{
		IncidentID:            req.IncidentID,
		DeploymentID:          req.DeploymentID,
		ReporterID:            req.ReporterID,
		SituationText:         req.SituationText,
		Remarks:               req.Remarks,
		PhotoURL:              req.PhotoURL,
		PersonnelCount:        req.PersonnelCount,
		EquipmentCount:        req.EquipmentCount,
		ReportType:            reportType,
		SubjectText:           req.SubjectText,
		InvolvedOccupancyType: req.InvolvedOccupancyType,
		TeamLeaderID:          req.TeamLeaderID,
		AreaOfDeploymentText:  req.AreaOfDeploymentText,
	}
	if err := r.db.WithContext(ctx).Create(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ReportRepo) GetByIncident(ctx context.Context, incidentID uuid.UUID) ([]models.SituationalReport, error) {
	var list []models.SituationalReport
	err := r.db.WithContext(ctx).Where("incident_id = ?", incidentID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *ReportRepo) GetByDeployment(ctx context.Context, deploymentID uuid.UUID) ([]models.SituationalReport, error) {
	var list []models.SituationalReport
	err := r.db.WithContext(ctx).Where("deployment_id = ?", deploymentID).Order("created_at DESC").Find(&list).Error
	return list, err
}

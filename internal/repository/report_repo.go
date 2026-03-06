package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// ReportRepo handles situational_reports
type ReportRepo struct {
	Pool *pgxpool.Pool
}

func NewReportRepo(pool *pgxpool.Pool) *ReportRepo {
	return &ReportRepo{Pool: pool}
}

func (r *ReportRepo) Create(ctx context.Context, req models.CreateReportRequest) (*models.SituationalReport, error) {
	reportType := req.ReportType
	if reportType == "" {
		reportType = "Situational"
	}
	var s models.SituationalReport
	err := r.Pool.QueryRow(ctx, `
		INSERT INTO situational_reports
		    (incident_id, deployment_id, reporter_id, situation_text, remarks, photo_url,
		     personnel_count, equipment_count, report_type, subject_text,
		     involved_occupancy_type, team_leader_id, area_of_deployment_text)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		RETURNING id, incident_id, deployment_id, reporter_id, situation_text, remarks, photo_url,
		          personnel_count, equipment_count, report_type, subject_text,
		          involved_occupancy_type, team_leader_id, area_of_deployment_text, created_at`,
		req.IncidentID, req.DeploymentID, req.ReporterID, req.SituationText, req.Remarks, req.PhotoURL,
		req.PersonnelCount, req.EquipmentCount, reportType, req.SubjectText,
		req.InvolvedOccupancyType, req.TeamLeaderID, req.AreaOfDeploymentText).Scan(
		&s.ID, &s.IncidentID, &s.DeploymentID, &s.ReporterID, &s.SituationText, &s.Remarks, &s.PhotoURL,
		&s.PersonnelCount, &s.EquipmentCount, &s.ReportType, &s.SubjectText,
		&s.InvolvedOccupancyType, &s.TeamLeaderID, &s.AreaOfDeploymentText, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ReportRepo) GetByIncident(ctx context.Context, incidentID uuid.UUID) ([]models.SituationalReport, error) {
	return r.queryReports(ctx, `WHERE incident_id=$1 ORDER BY created_at DESC`, incidentID)
}

func (r *ReportRepo) GetByDeployment(ctx context.Context, deploymentID uuid.UUID) ([]models.SituationalReport, error) {
	return r.queryReports(ctx, `WHERE deployment_id=$1 ORDER BY created_at DESC`, deploymentID)
}

func (r *ReportRepo) queryReports(ctx context.Context, where string, arg interface{}) ([]models.SituationalReport, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, incident_id, deployment_id, reporter_id, situation_text, remarks, photo_url,
		       personnel_count, equipment_count, report_type, subject_text,
		       involved_occupancy_type, team_leader_id, area_of_deployment_text, created_at
		FROM situational_reports `+where, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.SituationalReport
	for rows.Next() {
		var s models.SituationalReport
		if err := rows.Scan(&s.ID, &s.IncidentID, &s.DeploymentID, &s.ReporterID,
			&s.SituationText, &s.Remarks, &s.PhotoURL,
			&s.PersonnelCount, &s.EquipmentCount, &s.ReportType, &s.SubjectText,
			&s.InvolvedOccupancyType, &s.TeamLeaderID, &s.AreaOfDeploymentText, &s.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

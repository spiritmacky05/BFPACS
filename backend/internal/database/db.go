package database

import (
	"log"
	"os"
	"time"

	"github.com/sassinzz13/bfp-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewConnectionPool creates a new GORM DB connection and automigrates schemas
func NewConnectionPool() *gorm.DB {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	logLevel := logger.Warn
	if os.Getenv("GIN_MODE") != "release" {
		logLevel = logger.Info
	}

	config := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	// Retry connection up to 30 times (≈30s) – the DB may still be
	// running init SQL even after pg_isready passes.
	var db *gorm.DB
	var err error
	for i := 1; i <= 30; i++ {
		db, err = gorm.Open(postgres.Open(connStr), config)
		if err == nil {
			// Verify the underlying connection is truly usable
			if sqlDB, pingErr := db.DB(); pingErr == nil {
				if pingErr = sqlDB.Ping(); pingErr == nil {
					break
				}
			}
		}
		log.Printf("⏳ DB connection attempt %d/30 failed, retrying in 1s: %v", i, err)
		time.Sleep(time.Second)
	}
	if err != nil {
		log.Fatalf("Unable to connect to database after 30 retries: %v", err)
	}

	// AutoMigrate all models
	err = db.AutoMigrate(
		&models.User{},
		&models.Community{},
		&models.Station{},
		&models.LogisticalEquipment{},
		&models.Fleet{},
		&models.FleetMovementLog{},
		&models.DutyPersonnel{},
		&models.FireIncident{},
		&models.IncidentDispatch{},
		&models.Deployment{},
		&models.DeploymentAssignment{},
		&models.Hydrant{},
		&models.SituationalReport{},
		&models.Notification{},
		&models.PersonnelIncidentLog{},
		&models.IncidentStatusLog{},
		&models.CommunityIncidentReport{},
	)
	if err != nil {
		log.Printf("⚠️  AutoMigrate warning (non-fatal, existing schema used): %v", err)
	}

	// Drop FK constraint so personnel_incident_logs.personnel_id can hold
	// either duty_personnel IDs (NFC/PIN) or users IDs (responder check-ins).
	db.Exec("ALTER TABLE personnel_incident_logs DROP CONSTRAINT IF EXISTS personnel_incident_logs_personnel_id_fkey")

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get generic db object: %v", err)
	}
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(3 * time.Minute)

	log.Println("✅ Database connection pool established (GORM)")

	SeedInitialUsers(db)

	return db
}

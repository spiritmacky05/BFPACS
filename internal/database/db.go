package database

import (
	"log"
	"os"

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

	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	db, err := gorm.Open(postgres.Open(connStr), config)
	if err != nil {
		log.Fatalf("Unable to connect to database using GORM: %v", err)
	}

	// AutoMigrate all models
	err = db.AutoMigrate(
		&models.User{},
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
	)
	if err != nil {
		log.Fatalf("Warning: Database AutoMigrate failed: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get generic db object: %v", err)
	}
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetMaxOpenConns(20)

	log.Println("✅ Database connection pool established (GORM)")
	return db
}

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
		log.Printf("⚠️  AutoMigrate warning (non-fatal, existing schema used): %v", err)
	}

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

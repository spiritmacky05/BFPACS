package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sassinzz13/bfp-backend/internal/checkin"
	"github.com/sassinzz13/bfp-backend/internal/database"
	"github.com/sassinzz13/bfp-backend/internal/handlers"
	"github.com/sassinzz13/bfp-backend/internal/middleware"
	"github.com/sassinzz13/bfp-backend/internal/repository"
)

func main() {
	// Load .env file for local development
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading environment variables directly")
	}

	// Initialize DB connection pool
	db := database.NewConnectionPool()
	sqlDB, err := db.DB()
	if err == nil {
		defer sqlDB.Close()
	}

	// ── Repositories ──────────────────────────────────────────────────────────
	personnelRepo := repository.NewPersonnelRepo(db)
	fleetRepo := repository.NewFleetRepo(db)
	incidentRepo := repository.NewIncidentRepo(db)
	dispatchRepo := repository.NewDispatchRepo(db)
	deploymentRepo := repository.NewDeploymentRepo(db)
	hydrantRepo := repository.NewHydrantRepo(db)
	stationRepo := repository.NewStationRepo(db)
	reportRepo := repository.NewReportRepo(db)
	notifRepo := repository.NewNotificationRepo(db)
	equipmentRepo := repository.NewEquipmentRepo(db)
	checkinRepo := checkin.NewCheckInRepo(db)

	authRepo := repository.NewUserRepo(db)

	// ── Handlers ──────────────────────────────────────────────────────────────
	authH := handlers.NewAuthHandler(authRepo)
	personnelH := handlers.NewPersonnelHandler(personnelRepo)
	fleetH := handlers.NewFleetHandler(fleetRepo)
	incidentH := handlers.NewIncidentHandler(incidentRepo)
	dispatchH := handlers.NewDispatchHandler(dispatchRepo)
	deploymentH := handlers.NewDeploymentHandler(deploymentRepo)
	hydrantH := handlers.NewHydrantHandler(hydrantRepo)
	stationH := handlers.NewStationHandler(stationRepo)
	reportH := handlers.NewReportHandler(reportRepo)
	notifH := handlers.NewNotificationHandler(notifRepo)
	equipmentH := handlers.NewEquipmentHandler(equipmentRepo)
	checkinH := checkin.NewHandler(checkinRepo)

	// ── Router ────────────────────────────────────────────────────────────────
	r := gin.Default()

	// Global Middlewares
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.RateLimiter())

	v1 := r.Group("/api/v1")
	{
		// Health check (now under /api/v1/health)
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "service": "BFPACS API"})
		})

		// ── Public Auth ────────────────────────────────────────────────────
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
		}

		// ── Protected Routes ───────────────────────────────────────────────
		protected := v1.Group("")
		protected.Use(middleware.RequireAuth())
		{
			// ── Personnel ──────────────────────────────────────────────────────
			p := protected.Group("/personnel")
			{
				p.GET("", personnelH.GetAll)
				p.GET("/:id", personnelH.GetByID)
				p.POST("", personnelH.Create)
				p.PATCH("/:id/duty-status", personnelH.UpdateDutyStatus)
			}

			// ── Fleets ─────────────────────────────────────────────────────────
			f := protected.Group("/fleets")
			{
				f.GET("", fleetH.GetAll)
				f.GET("/:id", fleetH.GetByID)
				f.POST("", fleetH.Create)
				f.PATCH("/:id", fleetH.Update)
				f.PATCH("/:id/location", fleetH.UpdateLocation)
				f.POST("/:id/log-movement", fleetH.LogMovement)
				f.GET("/:id/movement-logs", fleetH.GetMovementLogs)
			}

			// ── Fire Incidents (10-70) ──────────────────────────────────────────
			i := protected.Group("/incidents")
			{
				i.GET("", incidentH.GetAll)
				i.GET("/:id", incidentH.GetByID)
				i.POST("", incidentH.Create)
				i.PATCH("/:id/status", incidentH.UpdateStatus)
			}

			// ── Incident Dispatches ─────────────────────────────────────────────
			d := protected.Group("/dispatches")
			{
				d.GET("", dispatchH.GetByIncident) // ?incident_id=
				d.POST("", dispatchH.DispatchFleet)
				d.PATCH("/:id/status", dispatchH.UpdateStatus)
			}

			// ── Deployments ────────────────────────────────────────────────────
			dep := protected.Group("/deployments")
			{
				dep.GET("", deploymentH.GetAll)
				dep.GET("/:id", deploymentH.GetByID)
				dep.POST("", deploymentH.Create)
				dep.POST("/:id/assign-fleet", deploymentH.AssignFleet)
				dep.GET("/:id/assignments", deploymentH.GetAssignments)
			}

			// ── Hydrants ───────────────────────────────────────────────────────
			h := protected.Group("/hydrants")
			{
				h.GET("", hydrantH.GetAll)
				h.GET("/nearby", hydrantH.GetNearby) // ?lat=&lng=&radius=
				h.GET("/:id", hydrantH.GetByID)
				h.POST("", hydrantH.Create)
			}

			// ── Stations ───────────────────────────────────────────────────────
			s := protected.Group("/stations")
			{
				s.GET("", stationH.GetAll)
				s.GET("/:id", stationH.GetByID)
				s.POST("", stationH.Create)
			}

			// ── Situational Reports ────────────────────────────────────────────
			rep := protected.Group("/reports")
			{
				rep.POST("", reportH.Create)
				rep.GET("/incident/:id", reportH.GetByIncident)
				rep.GET("/deployment/:id", reportH.GetByDeployment)
			}

			// ── Notifications ──────────────────────────────────────────────────
			n := protected.Group("/notifications")
			{
				n.GET("", notifH.GetForUser) // ?user_id=
				n.PATCH("/:id/read", notifH.MarkRead)
				n.PATCH("/read-all", notifH.MarkAllRead) // ?user_id=
			}

			// ── Logistical Equipment ───────────────────────────────────────────
			eq := protected.Group("/equipment")
			{
				eq.GET("", equipmentH.GetAll) // ?station_id= optional
				eq.POST("", equipmentH.Create)
				eq.PUT("/:id", equipmentH.Update)
				eq.DELETE("/:id", equipmentH.Delete)
				eq.PATCH("/:id/borrow", equipmentH.BorrowItem)
				eq.PATCH("/:id/return", equipmentH.ReturnItem)
			}

			// ── NFC / PIN Check-in ─────────────────────────────────────────────
			ci := protected.Group("/checkin")
			{
				ci.POST("/nfc", checkinH.NFCCheckIn)
				ci.POST("/pin", checkinH.PINCheckIn)
				ci.POST("/manual", checkinH.ManualCheckIn)   // admin deploy by UUID
				ci.GET("/logs", checkinH.GetLogsForIncident) // ?incident_id=
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("🚒 BFPACS API server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

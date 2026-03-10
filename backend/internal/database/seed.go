package database

import (
	"log"

	"github.com/sassinzz13/bfp-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedInitialUsers(db *gorm.DB) {
	// Ensure existing users (created before the `approved` column) can still log in.
	// Also normalize any legacy PascalCase roles to lowercase.
	db.Model(&models.User{}).Where("approved IS NULL").Update("approved", true)
	db.Model(&models.User{}).Where("LOWER(role) IN ?",
		[]string{"superadmin", "admin"},
	).Update("approved", true)

	// Normalize legacy PascalCase roles to lowercase
	for _, mapping := range []struct{ Old, New string }{
		{"SuperAdmin", "superadmin"},
		{"Admin", "admin"},
		{"Station Commander", "admin"},
	} {
		db.Model(&models.User{}).Where("role = ?", mapping.Old).Update("role", mapping.New)
	}

	users := []struct{ Email, Name, Role string }{
		{"superadmin@bfp.gov.ph", "Super Admin", "superadmin"},
		{"admin@bfp.gov.ph", "Regional Admin", "admin"},
		{"user@bfp.gov.ph", "Field Personnel", "user"},
	}

	for _, u := range users {
		var count int64
		db.Model(&models.User{}).Where("email = ?", u.Email).Count(&count)
		if count == 0 {
			hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("Failed to hash password for %s: %v", u.Email, err)
				continue
			}

			user := models.User{
				Email:        u.Email,
				FullName:     u.Name,
				PasswordHash: string(hash),
				Role:         u.Role,
				Approved:     true,
			}

			if err := db.Create(&user).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Email, err)
			} else {
				log.Printf("Successfully seeded %s account", u.Role)
			}
		}
	}
}

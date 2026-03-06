package main

import (
	"context"
	"fmt"

	"github.com/joho/godotenv"
	"github.com/sassinzz13/bfp-backend/internal/database"
	"github.com/sassinzz13/bfp-backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	godotenv.Load("/home/khristo/programming/WORK/bfp/BFPACS/.env")
	pool := database.NewConnectionPool()
	defer pool.Close()
	repo := repository.NewUserRepo(pool)

	users := []struct{ Email, Name, Role string }{
		{"superadmin@bfp.gov.ph", "Super Admin", "SuperAdmin"},
		{"admin@bfp.gov.ph", "Regional Admin", "Admin"},
		{"user@bfp.gov.ph", "Field Personnel", "user"},
	}

	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		_, err := repo.CreateUser(context.Background(), u.Email, u.Name, string(hash), u.Role, nil)
		if err != nil {
			fmt.Printf("Failed to create %s: %v\n", u.Email, err)
		} else {
			fmt.Printf("Created %s with role %s (password: password123)\n", u.Email, u.Role)
		}
	}
}

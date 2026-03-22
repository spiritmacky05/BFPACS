package models

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	FullName    string  `json:"full_name" binding:"required"` // Used as Station Name
	City        string  `json:"city" binding:"required"`
	District    string  `json:"district" binding:"required"`
	Region      string  `json:"region" binding:"required"`
	AddressText *string `json:"address_text"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

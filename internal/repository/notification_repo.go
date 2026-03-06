package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sassinzz13/bfp-backend/internal/models"
)

// NotificationRepo handles the notifications table
type NotificationRepo struct {
	Pool *pgxpool.Pool
}

func NewNotificationRepo(pool *pgxpool.Pool) *NotificationRepo {
	return &NotificationRepo{Pool: pool}
}

func (r *NotificationRepo) GetForUser(ctx context.Context, userID uuid.UUID) ([]models.Notification, error) {
	rows, err := r.Pool.Query(ctx, `
		SELECT id, user_id, title, message, is_read, created_at
		FROM notifications WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Notification
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}

func (r *NotificationRepo) MarkRead(ctx context.Context, id uuid.UUID) error {
	_, err := r.Pool.Exec(ctx, `UPDATE notifications SET is_read=true WHERE id=$1`, id)
	return err
}

func (r *NotificationRepo) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	_, err := r.Pool.Exec(ctx, `UPDATE notifications SET is_read=true WHERE user_id=$1`, userID)
	return err
}

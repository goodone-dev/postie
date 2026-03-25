package collection

import (
	"context"

	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CollectionFolderRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, CollectionFolder]
	FindMaxIdx(ctx context.Context, conds map[string]any) (int, error)
}

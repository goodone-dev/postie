package collection

import (
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CollectionFolderRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, CollectionFolder]
}

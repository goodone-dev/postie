package collection

import (
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CollectionRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, Collection]
}

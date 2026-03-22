package repository

import (
	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type collectionRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.Collection]
}

func NewCollectionRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.Collection]) collection.CollectionRepository {
	return &collectionRepository{
		baseRepo,
	}
}

package repository

import (
	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type collectionFolderRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder]
}

func NewCollectionFolderRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder]) collection.CollectionFolderRepository {
	return &collectionFolderRepository{
		baseRepo,
	}
}

package repository

import (
	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type collectionRequestRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionRequest]
}

func NewCollectionRequestRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionRequest]) collection.CollectionRequestRepository {
	return &collectionRequestRepository{
		baseRepo,
	}
}

package usecase

import (
	"github.com/goodone-dev/postie/internal/domain/collection"
)

type collectionUsecase struct {
	collectionRepo collection.CollectionRepository
	folderRepo     collection.CollectionFolderRepository
	requestRepo    collection.CollectionRequestRepository
}

func NewCollectionUsecase(collectionRepo collection.CollectionRepository, folderRepo collection.CollectionFolderRepository, requestRepo collection.CollectionRequestRepository) collection.CollectionUsecase {
	return &collectionUsecase{
		collectionRepo: collectionRepo,
		folderRepo:     folderRepo,
		requestRepo:    requestRepo,
	}
}

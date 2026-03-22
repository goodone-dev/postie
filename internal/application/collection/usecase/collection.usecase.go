package usecase

import (
	"context"
	"strings"

	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/infrastructure/logger"
	httperror "github.com/goodone-dev/postie/internal/utils/http_response/error"
	"github.com/google/uuid"
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

func toCollectionResponse(c collection.Collection) collection.CollectionResponse {
	return collection.CollectionResponse{
		ID:         c.ID,
		Name:       c.Name,
		Slug:       c.Slug,
		IsFavorite: c.IsFavorite,
	}
}

func (u *collectionUsecase) List(ctx context.Context, workspaceID uuid.UUID) ([]collection.CollectionResponse, error) {
	collections, err := u.collectionRepo.FindAll(ctx, map[string]any{
		"workspace_id": workspaceID,
	})
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to list collections").Write()
		return nil, err
	}

	result := make([]collection.CollectionResponse, len(collections))
	for i, c := range collections {
		result[i] = toCollectionResponse(c)
	}
	return result, nil
}

func (u *collectionUsecase) Create(ctx context.Context, payload collection.CreateCollectionRequest) (*collection.CollectionResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	entity := collection.Collection{
		WorkspaceID: payload.WorkspaceID,
		Name:        payload.Name,
		Slug:        slug,
		IsFavorite:  false,
	}

	col, err := u.collectionRepo.Insert(ctx, entity, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

// getEntity is an internal helper that returns the raw entity (not the DTO).
// Used by methods that need to read fields like WorkspaceID before transforming.
func (u *collectionUsecase) getEntity(ctx context.Context, ID uuid.UUID) (*collection.Collection, error) {
	col, err := u.collectionRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get collection").Write()
		return nil, err
	} else if col == nil {
		return nil, httperror.NewNotFoundError("collection not found")
	}
	return col, nil
}

func (u *collectionUsecase) Get(ctx context.Context, ID uuid.UUID) (*collection.CollectionResponse, error) {
	col, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}
	res := toCollectionResponse(*col)
	return &res, nil
}

func (u *collectionUsecase) Rename(ctx context.Context, ID uuid.UUID, name string) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	update := map[string]any{
		"name": name,
		"slug": slug,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) UpdateFavorite(ctx context.Context, ID uuid.UUID, isFavorite bool) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, map[string]any{
		"is_favorite": isFavorite,
	}, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update collection favorite").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) Delete(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.collectionRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete collection").Write()
		return err
	}
	return nil
}

func (u *collectionUsecase) Duplicate(ctx context.Context, ID uuid.UUID) (*collection.CollectionResponse, error) {
	original, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	newCol := collection.Collection{
		WorkspaceID: original.WorkspaceID,
		Name:        original.Name + " (copy)",
		Slug:        original.Slug + "-copy",
		IsFavorite:  false,
	}

	col, err := u.collectionRepo.Insert(ctx, newCol, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate collection").Write()
		return nil, err
	}

	// Duplicate folders
	folders, _ := u.folderRepo.FindAll(ctx, map[string]any{"collection_id": ID})
	folderIDMap := make(map[uuid.UUID]uuid.UUID) // old ID -> new ID
	for _, folder := range folders {
		if folder.ParentID != nil {
			continue // handle root folders first
		}
		newFolder := collection.CollectionFolder{
			CollectionID: col.ID,
			ParentID:     nil,
			Name:         folder.Name,
			Slug:         folder.Slug,
			Idx:          folder.Idx,
		}
		inserted, err := u.folderRepo.Insert(ctx, newFolder, nil)
		if err == nil {
			folderIDMap[folder.ID] = inserted.ID
		}
	}
	// Handle child folders
	for _, folder := range folders {
		if folder.ParentID == nil {
			continue
		}
		newParentID, ok := folderIDMap[*folder.ParentID]
		if !ok {
			continue
		}
		newFolder := collection.CollectionFolder{
			CollectionID: col.ID,
			ParentID:     &newParentID,
			Name:         folder.Name,
			Slug:         folder.Slug,
			Idx:          folder.Idx,
		}
		inserted, err := u.folderRepo.Insert(ctx, newFolder, nil)
		if err == nil {
			folderIDMap[folder.ID] = inserted.ID
		}
	}

	// Duplicate requests
	requests, _ := u.requestRepo.FindAll(ctx, map[string]any{"collection_id": ID})
	for _, req := range requests {
		var newFolderID *uuid.UUID
		if req.FolderID != nil {
			if mapped, ok := folderIDMap[*req.FolderID]; ok {
				newFolderID = &mapped
			}
		}
		newReq := collection.CollectionRequest{
			CollectionID: col.ID,
			FolderID:     newFolderID,
			Name:         req.Name,
			Slug:         req.Slug,
			Method:       req.Method,
			URL:          req.URL,
			Params:       req.Params,
			Auth:         req.Auth,
			Headers:      req.Headers,
			Body:         req.Body,
			Scripts:      req.Scripts,
			Settings:     req.Settings,
			Idx:          req.Idx,
		}
		u.requestRepo.Insert(ctx, newReq, nil) //nolint:errcheck
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) Move(ctx context.Context, ID uuid.UUID, payload collection.MoveCollectionRequest) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, map[string]any{
		"workspace_id": payload.TargetWorkspaceID,
	}, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to move collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

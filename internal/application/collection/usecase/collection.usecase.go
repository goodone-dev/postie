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
		IsOpen:     false,
		Items:      make([]map[string]any, 0),
	}
}

func (u *collectionUsecase) buildTree(ctx context.Context, colID uuid.UUID) []map[string]any {
	folders, _ := u.folderRepo.FindAll(ctx, map[string]any{"collection_id": colID})
	requests, _ := u.requestRepo.FindAll(ctx, map[string]any{"collection_id": colID})

	var recurse func(parentID *uuid.UUID) []map[string]any
	recurse = func(parentID *uuid.UUID) []map[string]any {
		items := make([]map[string]any, 0)
		for _, f := range folders {
			match := (f.ParentID == nil && parentID == nil) || (f.ParentID != nil && parentID != nil && *f.ParentID == *parentID)
			if match {
				idStr := f.ID.String()
				folderNode := map[string]any{
					"type":   "folder",
					"id":     idStr,
					"name":   f.Name,
					"isOpen": false,
					"items":  recurse(&f.ID),
				}
				items = append(items, folderNode)
			}
		}
		for _, r := range requests {
			match := (r.FolderID == nil && parentID == nil) || (r.FolderID != nil && parentID != nil && *r.FolderID == *parentID)
			if match {
				reqNode := map[string]any{
					"type":   "request",
					"id":     r.ID.String(),
					"name":   r.Name,
					"method": r.Method,
					"url":    r.URL,
					// Add dummy fields required by frontend to function
					"headers":       []any{},
					"params":        []any{},
					"pathVariables": []any{},
					"body": map[string]any{
						"type":       "none",
						"rawType":    "JSON",
						"raw":        "",
						"formData":   []any{},
						"urlEncoded": []any{},
					},
					"auth":     map[string]any{"type": "none"},
					"examples": []any{},
				}
				items = append(items, reqNode)
			}
		}
		return items
	}

	return recurse(nil)
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
		res := toCollectionResponse(c)
		res.Items = u.buildTree(ctx, c.ID)
		result[i] = res
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
	res.Items = u.buildTree(ctx, col.ID)
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

	update := map[string]any{
		"is_favorite": isFavorite,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
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

	update := map[string]any{
		"workspace_id": payload.TargetWorkspaceID,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to move collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

// ── Folder Operations ─────────────────────────────────────────────────────────

func toFolderResponse(f collection.CollectionFolder) collection.FolderResponse {
	return collection.FolderResponse{
		ID:           f.ID,
		CollectionID: f.CollectionID,
		ParentID:     f.ParentID,
		Name:         f.Name,
		Slug:         f.Slug,
		Idx:          f.Idx,
	}
}

func (u *collectionUsecase) CreateFolder(ctx context.Context, payload collection.CreateFolderRequest) (*collection.FolderResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	conds := map[string]any{"collection_id": payload.CollectionID}
	if payload.ParentID != nil {
		conds["parent_id"] = *payload.ParentID
	} else {
		conds["parent_id"] = nil
	}

	maxIdx, err := u.folderRepo.FindMaxIdx(ctx, conds)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to find max idx").Write()
		return nil, err
	}

	count := maxIdx + 1

	folder := collection.CollectionFolder{
		CollectionID: payload.CollectionID,
		ParentID:     payload.ParentID,
		Name:         payload.Name,
		Slug:         slug,
		Idx:          int(count),
	}

	inserted, err := u.folderRepo.Insert(ctx, folder, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create folder").Write()
		return nil, err
	}

	res := toFolderResponse(inserted)
	return &res, nil
}

func (u *collectionUsecase) getFolderEntity(ctx context.Context, ID uuid.UUID) (*collection.CollectionFolder, error) {
	folder, err := u.folderRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get folder").Write()
		return nil, err
	} else if folder == nil {
		return nil, httperror.NewNotFoundError("folder not found")
	}

	return folder, nil
}

func (u *collectionUsecase) RenameFolder(ctx context.Context, ID uuid.UUID, payload collection.RenameFolderRequest) (*collection.FolderResponse, error) {
	_, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))
	update := map[string]any{
		"name": payload.Name,
		"slug": slug,
	}

	folder, err := u.folderRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename folder").Write()
		return nil, err
	}

	res := toFolderResponse(folder)
	return &res, nil
}

func (u *collectionUsecase) DeleteFolder(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.folderRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete folder").Write()
		return err
	}

	return nil
}

func (u *collectionUsecase) DuplicateFolder(ctx context.Context, ID uuid.UUID) (*collection.FolderResponse, error) {
	folder, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	// Insert the root duplicate
	newFolder := collection.CollectionFolder{
		CollectionID: folder.CollectionID,
		ParentID:     folder.ParentID,
		Name:         folder.Name + " (copy)",
		Slug:         folder.Slug + "-copy",
		Idx:          folder.Idx + 1,
	}

	inserted, err := u.folderRepo.Insert(ctx, newFolder, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate folder").Write()
		return nil, err
	}

	// folderIDMap seeds with the root; the multi-pass loop below propagates it
	// to every descendant, so no separate subtree-collection step is needed.
	folderIDMap := map[uuid.UUID]uuid.UUID{folder.ID: inserted.ID}

	// Exclude the root (already handled) and keep only direct/indirect children.
	allFolders, _ := u.folderRepo.FindAll(ctx, map[string]any{"collection_id": folder.CollectionID})
	remaining := make([]collection.CollectionFolder, 0, len(allFolders))

	for _, f := range allFolders {
		if f.ID != folder.ID && f.ParentID != nil {
			remaining = append(remaining, f)
		}
	}

	// Insert children level by level; stop when nothing progresses.
	cloneFolder := func(f collection.CollectionFolder, newParentID uuid.UUID) collection.CollectionFolder {
		return collection.CollectionFolder{
			CollectionID: inserted.CollectionID,
			ParentID:     &newParentID,
			Name:         f.Name,
			Slug:         f.Slug,
			Idx:          f.Idx,
		}
	}

	for len(remaining) > 0 {
		progressed := false
		var deferred []collection.CollectionFolder

		for _, f := range remaining {
			newParentID, ok := folderIDMap[*f.ParentID]
			if !ok {
				deferred = append(deferred, f)
				continue
			}

			if child, err := u.folderRepo.Insert(ctx, cloneFolder(f, newParentID), nil); err == nil {
				folderIDMap[f.ID] = child.ID
				progressed = true
			} else {
				deferred = append(deferred, f)
			}
		}

		remaining = deferred
		if !progressed {
			break // avoid infinite loop on persistent errors
		}
	}

	// Duplicate requests that belong to any folder in the copied subtree.
	requests, _ := u.requestRepo.FindAll(ctx, map[string]any{"collection_id": folder.CollectionID})
	for _, req := range requests {
		if req.FolderID == nil {
			continue
		}

		newFolderID, ok := folderIDMap[*req.FolderID]
		if !ok {
			continue
		}

		u.requestRepo.Insert(ctx, collection.CollectionRequest{ //nolint:errcheck
			CollectionID: req.CollectionID,
			FolderID:     &newFolderID,
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
		}, nil)
	}

	res := toFolderResponse(inserted)
	return &res, nil
}

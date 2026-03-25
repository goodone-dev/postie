package main

import (
	"context"

	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/domain/environment"
	"github.com/goodone-dev/postie/internal/domain/workspace"
	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx                context.Context
	workspaceUsecase   workspace.WorkspaceUsecase
	collectionUsecase  collection.CollectionUsecase
	environmentUsecase environment.EnvironmentUsecase
}

// NewApp creates a new App application struct
func NewApp(app App) *App {
	return &app
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ── Workspace ────────────────────────────────────────────────────────────────

func (a *App) CreateWorkspace(payload workspace.CreateWorkspaceRequest) (*workspace.WorkspaceResponse, error) {
	return a.workspaceUsecase.Create(a.ctx, payload)
}

func (a *App) GetWorkspace(id string) (*workspace.WorkspaceResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.workspaceUsecase.Get(a.ctx, uid)
}

func (a *App) RenameWorkspace(id string, name string) (*workspace.WorkspaceResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.workspaceUsecase.Rename(a.ctx, uid, name)
}

func (a *App) DeleteWorkspace(id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return a.workspaceUsecase.Delete(a.ctx, uid)
}

func (a *App) ListWorkspaces() ([]workspace.WorkspaceResponse, error) {
	return a.workspaceUsecase.List(a.ctx)
}

// ── Collection ───────────────────────────────────────────────────────────────

func (a *App) ListCollections(workspaceID string) ([]collection.CollectionResponse, error) {
	uid, err := uuid.Parse(workspaceID)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.List(a.ctx, uid)
}

// GetCollection fetches a single collection with its full folder/request tree.
// Call this when the user opens (expands) a collection in the sidebar.
func (a *App) GetCollection(id string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.Get(a.ctx, uid)
}

func (a *App) CreateCollection(payload collection.CreateCollectionRequest) (*collection.CollectionResponse, error) {
	return a.collectionUsecase.Create(a.ctx, payload)
}

func (a *App) RenameCollection(id string, name string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.Rename(a.ctx, uid, name)
}

func (a *App) UpdateCollectionFavorite(id string, isFavorite bool) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.UpdateFavorite(a.ctx, uid, isFavorite)
}

func (a *App) DeleteCollection(id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return a.collectionUsecase.Delete(a.ctx, uid)
}

func (a *App) DuplicateCollection(id string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.Duplicate(a.ctx, uid)
}

func (a *App) MoveCollection(id string, payload collection.MoveCollectionRequest) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.Move(a.ctx, uid, payload)
}

// ── Folder ───────────────────────────────────────────────────────────────

func (a *App) CreateFolder(payload collection.CreateFolderRequest) (*collection.FolderResponse, error) {
	return a.collectionUsecase.CreateFolder(a.ctx, payload)
}

func (a *App) RenameFolder(id string, payload collection.RenameFolderRequest) (*collection.FolderResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.RenameFolder(a.ctx, uid, payload)
}

func (a *App) DeleteFolder(id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return a.collectionUsecase.DeleteFolder(a.ctx, uid)
}

func (a *App) DuplicateFolder(id string) (*collection.FolderResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.collectionUsecase.DuplicateFolder(a.ctx, uid)
}

// ── Environment ───────────────────────────────────────────────────────────────

func (a *App) ListEnvironments(workspaceID string) ([]environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(workspaceID)
	if err != nil {
		return nil, err
	}
	return a.environmentUsecase.List(a.ctx, uid)
}

func (a *App) CreateEnvironment(payload environment.CreateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	return a.environmentUsecase.Create(a.ctx, payload)
}

func (a *App) UpdateEnvironment(id string, payload environment.UpdateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.environmentUsecase.Update(a.ctx, uid, payload)
}

func (a *App) DeleteEnvironment(id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return a.environmentUsecase.Delete(a.ctx, uid)
}

func (a *App) DuplicateEnvironment(id string) (*environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.environmentUsecase.Duplicate(a.ctx, uid)
}

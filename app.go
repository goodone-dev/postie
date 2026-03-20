package main

import (
	"context"

	"github.com/goodone-dev/postie/internal/domain/workspace"
	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx              context.Context
	workspaceUsecase workspace.WorkspaceUsecase
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

func (a *App) CreateWorkspace(payload workspace.CreateWorkspaceRequest) (*workspace.Workspace, error) {
	return a.workspaceUsecase.Create(a.ctx, payload)
}

func (a *App) GetWorkspace(id string) (*workspace.Workspace, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.workspaceUsecase.Get(a.ctx, uid)
}

func (a *App) UpdateWorkspace(id string, payload workspace.CreateWorkspaceRequest) (*workspace.Workspace, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return a.workspaceUsecase.Update(a.ctx, uid, payload)
}

func (a *App) DeleteWorkspace(id string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return a.workspaceUsecase.Delete(a.ctx, uid)
}

func (a *App) ListWorkspaces() ([]workspace.Workspace, error) {
	return a.workspaceUsecase.List(a.ctx)
}

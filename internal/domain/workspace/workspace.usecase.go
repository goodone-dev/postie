package workspace

import (
	"context"

	"github.com/google/uuid"
)

type WorkspaceUsecase interface {
	Create(ctx context.Context, payload CreateWorkspaceRequest) (*WorkspaceResponse, error)
	Get(ctx context.Context, ID uuid.UUID) (*WorkspaceResponse, error)
	Rename(ctx context.Context, ID uuid.UUID, name string) (*WorkspaceResponse, error)
	Delete(ctx context.Context, ID uuid.UUID) error
	List(ctx context.Context) ([]WorkspaceResponse, error)
}

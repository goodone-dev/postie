package workspace

import (
	"context"

	"github.com/google/uuid"
)

type WorkspaceUsecase interface {
	Create(ctx context.Context, payload CreateWorkspaceRequest) (*Workspace, error)
	Get(ctx context.Context, ID uuid.UUID) (*Workspace, error)
	Update(ctx context.Context, ID uuid.UUID, payload CreateWorkspaceRequest) (*Workspace, error)
	Delete(ctx context.Context, ID uuid.UUID) error
	List(ctx context.Context) ([]Workspace, error)
}

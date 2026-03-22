package environment

import (
	"context"

	"github.com/google/uuid"
)

type EnvironmentUsecase interface {
	Create(ctx context.Context, payload CreateEnvironmentRequest) (*EnvironmentResponse, error)
	Get(ctx context.Context, ID uuid.UUID) (*EnvironmentResponse, error)
	Update(ctx context.Context, ID uuid.UUID, payload UpdateEnvironmentRequest) (*EnvironmentResponse, error)
	Delete(ctx context.Context, ID uuid.UUID) error
	List(ctx context.Context, workspaceID uuid.UUID) ([]EnvironmentResponse, error)
	Duplicate(ctx context.Context, ID uuid.UUID) (*EnvironmentResponse, error)
}

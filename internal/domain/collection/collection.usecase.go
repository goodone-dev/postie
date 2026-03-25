package collection

import (
	"context"

	"github.com/google/uuid"
)

type CollectionUsecase interface {
	List(ctx context.Context, workspaceID uuid.UUID) ([]CollectionResponse, error)
	Create(ctx context.Context, payload CreateCollectionRequest) (*CollectionResponse, error)
	Get(ctx context.Context, ID uuid.UUID) (*CollectionResponse, error)
	Rename(ctx context.Context, ID uuid.UUID, name string) (*CollectionResponse, error)
	UpdateFavorite(ctx context.Context, ID uuid.UUID, isFavorite bool) (*CollectionResponse, error)
	Delete(ctx context.Context, ID uuid.UUID) error
	Duplicate(ctx context.Context, ID uuid.UUID) (*CollectionResponse, error)
	Move(ctx context.Context, ID uuid.UUID, payload MoveCollectionRequest) (*CollectionResponse, error)

	// Folder Operations
	CreateFolder(ctx context.Context, payload CreateFolderRequest) (*FolderResponse, error)
	RenameFolder(ctx context.Context, ID uuid.UUID, payload RenameFolderRequest) (*FolderResponse, error)
	DeleteFolder(ctx context.Context, ID uuid.UUID) error
	DuplicateFolder(ctx context.Context, ID uuid.UUID) (*FolderResponse, error)

	// Request Operations
	CreateRequest(ctx context.Context, payload CreateRequestRequest) (*RequestResponse, error)
	RenameRequest(ctx context.Context, ID uuid.UUID, payload RenameRequestRequest) (*RequestResponse, error)
	UpdateRequest(ctx context.Context, ID uuid.UUID, payload UpdateRequestRequest) (*RequestResponse, error)
	DeleteRequest(ctx context.Context, ID uuid.UUID) error
	DuplicateRequest(ctx context.Context, ID uuid.UUID) (*RequestResponse, error)
}

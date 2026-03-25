package collection

import "github.com/google/uuid"

type CreateCollectionRequest struct {
	WorkspaceID uuid.UUID `json:"workspace_id" validate:"required"`
	Name        string    `json:"name" validate:"required"`
}

type UpdateCollectionRequest struct {
	Name       string `json:"name" validate:"required"`
	IsFavorite *bool  `json:"is_favorite,omitempty"`
}

type MoveCollectionRequest struct {
	TargetWorkspaceID uuid.UUID `json:"target_workspace_id" validate:"required"`
}

type CollectionResponse struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Slug       string    `json:"slug"`
	IsFavorite bool      `json:"is_favorite"`
	IsOpen     bool      `json:"isOpen"`
	Items      any       `json:"items"`
}

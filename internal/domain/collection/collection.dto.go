package collection

import "github.com/google/uuid"

// Collection DTOs

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

// ── Folder DTOs ───────────────────────────────────────────────────────────────

type CreateFolderRequest struct {
	CollectionID uuid.UUID  `json:"collection_id" validate:"required"`
	ParentID     *uuid.UUID `json:"parent_id,omitempty"`
	Name         string     `json:"name" validate:"required"`
}

type RenameFolderRequest struct {
	Name string `json:"name" validate:"required"`
}

type FolderResponse struct {
	ID           uuid.UUID  `json:"id"`
	CollectionID uuid.UUID  `json:"collection_id"`
	ParentID     *uuid.UUID `json:"parent_id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	Idx          int        `json:"idx"`
}

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
	ID         uuid.UUID        `json:"id"`
	Name       string           `json:"name"`
	Slug       string           `json:"slug"`
	IsFavorite bool             `json:"is_favorite"`
	SortOrder  SortOrder        `json:"sort_order"`
	Items      []CollectionTree `json:"items"`
}

type CollectionTree struct {
	Type      TreeType         `json:"type"`
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Method    *string          `json:"method,omitempty"`
	SortOrder *SortOrder       `json:"sort_order,omitempty"`
	Items     []CollectionTree `json:"items,omitempty"`
}

type TreeType string

const (
	TreeTypeFolder  TreeType = "folder"
	TreeTypeRequest TreeType = "request"
)

type SortOrder string

const (
	SortOrderDefault SortOrder = "default"
	SortOrderAlpha   SortOrder = "alpha"
)

type ReorderItemsRequest struct {
	ParentFolderID *string          `json:"parent_folder_id"`
	Items          []CollectionTree `json:"items,omitempty"`
}

package collection

import "github.com/google/uuid"

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

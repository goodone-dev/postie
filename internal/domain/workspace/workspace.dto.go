package workspace

import "github.com/google/uuid"

type CreateWorkspaceRequest struct {
	Name string `json:"name" validate:"required"`
}

type WorkspaceResponse struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Slug string    `json:"slug"`
}

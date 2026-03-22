package environment

import "github.com/google/uuid"

type EnvironmentVariable struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type CreateEnvironmentRequest struct {
	WorkspaceID uuid.UUID             `json:"workspace_id" validate:"required"`
	Name        string                `json:"name" validate:"required"`
	Variables   []EnvironmentVariable `json:"variables"`
}

type UpdateEnvironmentRequest struct {
	Name      string                `json:"name" validate:"required"`
	Variables []EnvironmentVariable `json:"variables"`
}

type EnvironmentResponse struct {
	ID          uuid.UUID             `json:"id"`
	WorkspaceID uuid.UUID             `json:"workspace_id"`
	Name        string                `json:"name"`
	Slug        string                `json:"slug"`
	Variables   []EnvironmentVariable `json:"variables"`
}

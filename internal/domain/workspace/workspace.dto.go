package workspace

type CreateWorkspaceRequest struct {
	Name string `json:"name" validate:"required"`
}

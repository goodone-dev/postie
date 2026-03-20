package usecase

import (
	"context"
	"strings"

	"github.com/goodone-dev/postie/internal/domain/workspace"
	"github.com/goodone-dev/postie/internal/infrastructure/logger"
	httperror "github.com/goodone-dev/postie/internal/utils/http_response/error"
	"github.com/google/uuid"
)

type workspaceUsecase struct {
	workspaceRepo workspace.WorkspaceRepository
}

func NewWorkspaceUsecase(workspaceRepo workspace.WorkspaceRepository) workspace.WorkspaceUsecase {
	return &workspaceUsecase{
		workspaceRepo: workspaceRepo,
	}
}

func (u *workspaceUsecase) Create(ctx context.Context, payload workspace.CreateWorkspaceRequest) (*workspace.Workspace, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	entity := workspace.Workspace{
		Name: payload.Name,
		Slug: slug,
	}

	workspace, err := u.workspaceRepo.Insert(ctx, entity, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create workspace").Write()
		return nil, err
	}

	return &workspace, nil
}

func (u *workspaceUsecase) Get(ctx context.Context, ID uuid.UUID) (*workspace.Workspace, error) {
	workspace, err := u.workspaceRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get workspace").Write()
		return nil, err
	} else if workspace == nil {
		return nil, httperror.NewNotFoundError("workspace not found")
	}

	return workspace, nil
}

func (u *workspaceUsecase) Update(ctx context.Context, ID uuid.UUID, payload workspace.CreateWorkspaceRequest) (*workspace.Workspace, error) {
	_, err := u.Get(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	update := map[string]any{
		"name": payload.Name,
		"slug": slug,
	}

	workspace, err := u.workspaceRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update workspace").Write()
		return nil, err
	}

	return &workspace, nil
}

func (u *workspaceUsecase) Delete(ctx context.Context, ID uuid.UUID) error {
	_, err := u.Get(ctx, ID)
	if err != nil {
		return err
	}

	err = u.workspaceRepo.DeleteById(ctx, ID, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to delete workspace").Write()
		return err
	}

	return nil
}

func (u *workspaceUsecase) List(ctx context.Context) ([]workspace.Workspace, error) {
	workspaces, err := u.workspaceRepo.FindAll(ctx, map[string]any{})
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to list workspaces").Write()
		return nil, err
	}

	if len(workspaces) > 0 {
		return workspaces, nil
	}

	defaultWorkspace, err := u.Create(ctx, workspace.CreateWorkspaceRequest{
		Name: "My Workspace",
	})

	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create default workspace").Write()
		return nil, err
	}

	return []workspace.Workspace{*defaultWorkspace}, nil
}

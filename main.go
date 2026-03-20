package main

import (
	"context"
	"embed"

	workspaceRepoImpl "github.com/goodone-dev/postie/internal/application/workspace/repository"
	workspaceUsecaseImpl "github.com/goodone-dev/postie/internal/application/workspace/usecase"
	"github.com/goodone-dev/postie/internal/config"
	"github.com/goodone-dev/postie/internal/domain/workspace"
	"github.com/goodone-dev/postie/internal/infrastructure/database/sqlite"
	"github.com/goodone-dev/postie/internal/infrastructure/logger"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"gorm.io/gorm"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	ctx := context.Background()

	// Load configuration
	err := config.Load()
	if err != nil {
		logger.Fatal(ctx, err, "❌ Could not load environment variables")
	}

	// Initialize database
	dbConn := sqlite.Open(ctx)

	// Dependency Injection Layers
	workspaceBaseRepo := sqlite.NewBaseRepository[gorm.DB, uuid.UUID, workspace.Workspace](dbConn)
	workspaceRepo := workspaceRepoImpl.NewWorkspaceRepository(workspaceBaseRepo)
	workspaceUsecase := workspaceUsecaseImpl.NewWorkspaceUsecase(workspaceRepo)

	// Create an instance of the app structure
	app := NewApp(App{
		workspaceUsecase: workspaceUsecase,
	})

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "Postie",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []any{
			app,
		},
	})

	if err != nil {
		logger.Fatal(ctx, err, "❌ Could not run application")
	}
}

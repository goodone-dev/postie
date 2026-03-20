package workspace

import (
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkspaceRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, Workspace]
}

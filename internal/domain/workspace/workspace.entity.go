package workspace

import (
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
)

type Workspace struct {
	database.BaseEntity[uuid.UUID] `bson:",inline"`
	Name                           string `json:"name"`
	Slug                           string `json:"slug"`
}

func (Workspace) TableName() string {
	return "workspaces"
}

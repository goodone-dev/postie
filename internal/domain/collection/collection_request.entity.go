package collection

import (
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
)

type CollectionRequest struct {
	database.BaseEntity[uuid.UUID]
	CollectionID uuid.UUID  `json:"collection_id"`
	FolderID     *uuid.UUID `json:"folder_id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	Method       string     `json:"method"`
	URL          string     `json:"url"`
	Params       []byte     `json:"params"`
	Auth         []byte     `json:"auth"`
	Headers      []byte     `json:"headers"`
	Body         []byte     `json:"body"`
	Scripts      []byte     `json:"scripts"`
	Settings     []byte     `json:"settings"`
	Idx          int        `json:"idx"`
}

func (CollectionRequest) TableName() string {
	return "collection_requests"
}

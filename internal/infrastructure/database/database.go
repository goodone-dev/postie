package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Entity interface {
	TableName() string
}

type BaseEntity[I any] struct {
	ID        I          `json:"id" bson:"_id,omitempty"`
	CreatedAt *time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt *time.Time `json:"updated_at" bson:"updated_at"`
}

func (b *BaseEntity[I]) BeforeCreate(tx *gorm.DB) (err error) {
	id, ok := any(b.ID).(uuid.UUID)
	if !ok {
		return nil
	} else if id != uuid.Nil {
		return nil
	}

	id, err = uuid.NewV7()
	if err != nil {
		return err
	}

	b.ID = any(id).(I)

	return nil
}

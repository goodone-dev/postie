package repository

import (
	"context"

	sq "github.com/Masterminds/squirrel"
	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type collectionFolderRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder]
}

func NewCollectionFolderRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder]) collection.CollectionFolderRepository {
	return &collectionFolderRepository{
		baseRepo,
	}
}

func (r *collectionFolderRepository) FindMaxIdx(ctx context.Context, conds map[string]any) (maxIdx int, err error) {
	model := collection.CollectionFolder{}

	builder := sq.
		Select("MAX(idx)").
		From(model.TableName()).
		Where(conds)

	qry, args, err := builder.ToSql()
	if err != nil {
		return
	}

	var res *int
	err = r.DB().WithContext(ctx).Raw(qry, args...).Scan(&res).Error
	if err != nil {
		return 0, err
	} else if res == nil {
		return 0, nil
	}

	return *res, nil
}

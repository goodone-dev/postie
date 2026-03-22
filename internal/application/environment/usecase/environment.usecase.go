package usecase

import (
	"github.com/goodone-dev/postie/internal/domain/environment"
)

type environmentUsecase struct {
	environmentRepo environment.EnvironmentRepository
}

func NewEnvironmentUsecase(environmentRepo environment.EnvironmentRepository) environment.EnvironmentUsecase {
	return &environmentUsecase{
		environmentRepo: environmentRepo,
	}
}

package customers

import (
	"context"
	"errors"
	"fmt"
	"regexp"
)

var (
	ErrInvalid     = errors.New("invalid customer ID")
	ErrNotFound    = errors.New("customer not found")
	ErrUnavailable = errors.New("customer lookup unavailable")
	validID        = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`)
)

func ValidID(id string) bool { return validID.MatchString(id) }

// Directory returns found=false for an unknown customer, and an error for failure.
type Directory interface {
	LookupName(context.Context, string) (name string, found bool, err error)
}

type Service struct{ directory Directory }

func New(directory Directory) *Service { return &Service{directory: directory} }

type Customer struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (s *Service) Get(ctx context.Context, id string) (Customer, error) {
	if !ValidID(id) {
		return Customer{}, ErrInvalid
	}
	name, found, err := s.directory.LookupName(ctx, id)
	if err != nil {
		return Customer{}, fmt.Errorf("%w: %w", ErrUnavailable, err)
	}
	if !found {
		return Customer{}, ErrNotFound
	}
	return Customer{ID: id, Name: name}, nil
}

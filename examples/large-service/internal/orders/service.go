package orders

import (
	"context"
	"fmt"

	"example.com/large-service/internal/billing"
	"example.com/large-service/internal/customers"
	"example.com/large-service/internal/money"
)

// CustomerDirectory is the capability orders needs, not the whole identity API.
type CustomerDirectory interface {
	Exists(context.Context, string) (bool, error)
}
type Quoter interface {
	Quote(context.Context, money.Amount) (billing.Quote, error)
}

type Service struct {
	directory CustomerDirectory
	billing   Quoter
}

func New(directory CustomerDirectory, billing Quoter) *Service {
	return &Service{directory: directory, billing: billing}
}

type Quote struct {
	CustomerID string        `json:"customer_id"`
	Price      billing.Quote `json:"price"`
}

func (s *Service) Quote(ctx context.Context, customerID string, subtotal money.Amount) (Quote, error) {
	if !customers.ValidID(customerID) {
		return Quote{}, customers.ErrInvalid
	}
	if err := subtotal.Validate(); err != nil {
		return Quote{}, err
	}
	found, err := s.directory.Exists(ctx, customerID)
	if err != nil {
		return Quote{}, fmt.Errorf("%w: %w", customers.ErrUnavailable, err)
	}
	if !found {
		return Quote{}, customers.ErrNotFound
	}
	price, err := s.billing.Quote(ctx, subtotal)
	if err != nil {
		return Quote{}, fmt.Errorf("quote order: %w", err)
	}
	return Quote{CustomerID: customerID, Price: price}, nil
}

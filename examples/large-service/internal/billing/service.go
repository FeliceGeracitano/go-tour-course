package billing

import (
	"context"
	"errors"
	"fmt"

	"example.com/large-service/internal/money"
)

var ErrUnavailable = errors.New("fee lookup unavailable")

// Fees returns a nonnegative fee in USD cents; it never charges a card.
type Fees interface {
	Fee(context.Context, money.Amount) (money.Amount, error)
}

type Service struct{ fees Fees }

func New(fees Fees) *Service { return &Service{fees: fees} }

type Quote struct {
	Subtotal money.Amount `json:"subtotal_cents"`
	Fee      money.Amount `json:"fee_cents"`
	Total    money.Amount `json:"total_cents"`
}

func (s *Service) Quote(ctx context.Context, subtotal money.Amount) (Quote, error) {
	if err := subtotal.Validate(); err != nil {
		return Quote{}, err
	}
	fee, err := s.fees.Fee(ctx, subtotal)
	if err != nil {
		return Quote{}, fmt.Errorf("%w: %w", ErrUnavailable, err)
	}
	total, err := subtotal.Add(fee)
	if err != nil {
		return Quote{}, fmt.Errorf("%w: invalid upstream fee", ErrUnavailable)
	}
	return Quote{Subtotal: subtotal, Fee: fee, Total: total}, nil
}

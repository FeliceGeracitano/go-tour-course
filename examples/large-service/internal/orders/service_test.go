package orders

import (
	"context"
	"errors"
	"testing"

	"example.com/large-service/internal/billing"
	"example.com/large-service/internal/customers"
	"example.com/large-service/internal/money"
)

type directoryFunc func(context.Context, string) (bool, error)

func (f directoryFunc) Exists(ctx context.Context, id string) (bool, error) { return f(ctx, id) }

type quoteFunc func(context.Context, money.Amount) (billing.Quote, error)

func (f quoteFunc) Quote(ctx context.Context, a money.Amount) (billing.Quote, error) {
	return f(ctx, a)
}

func TestMissingCustomerDoesNotRequestPrice(t *testing.T) {
	directory := directoryFunc(func(context.Context, string) (bool, error) { return false, nil })
	pricing := quoteFunc(func(context.Context, money.Amount) (billing.Quote, error) {
		t.Fatal("pricing called for missing customer")
		return billing.Quote{}, nil
	})
	_, err := New(directory, pricing).Quote(context.Background(), "missing", 1000)
	if !errors.Is(err, customers.ErrNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestQuotePropagatesContextAndFailure(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	directory := directoryFunc(func(got context.Context, id string) (bool, error) {
		if got != ctx || id != "c1" {
			t.Fatal("lost request context or ID")
		}
		return true, nil
	})
	pricing := quoteFunc(func(got context.Context, a money.Amount) (billing.Quote, error) {
		if got != ctx || a != 1000 {
			t.Fatal("lost request context or subtotal")
		}
		return billing.Quote{}, got.Err()
	})
	_, err := New(directory, pricing).Quote(ctx, "c1", 1000)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("got %v", err)
	}
}

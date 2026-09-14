// Package money models nonnegative USD cents for this example.
package money

import "errors"

var ErrInvalid = errors.New("amount must be between 0 and 100000000 USD cents")

type Amount int64

const Max Amount = 100_000_000

func (a Amount) Validate() error {
	if a < 0 || a > Max {
		return ErrInvalid
	}
	return nil
}

func (a Amount) Add(b Amount) (Amount, error) {
	if a.Validate() != nil || b.Validate() != nil || a > Max-b {
		return 0, ErrInvalid
	}
	return a + b, nil
}

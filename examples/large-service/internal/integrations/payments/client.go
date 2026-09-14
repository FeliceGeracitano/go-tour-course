package payments

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"example.com/large-service/internal/integrations/httpjson"
	"example.com/large-service/internal/money"
)

type Client struct{ json *httpjson.Client }

func New(base string, client *http.Client) (*Client, error) {
	json, err := httpjson.New(base, client)
	if err != nil {
		return nil, err
	}
	return &Client{json: json}, nil
}

func (c *Client) Fee(ctx context.Context, subtotal money.Amount) (money.Amount, error) {
	var payload struct {
		Fee *money.Amount `json:"fee_cents"`
	}
	status, err := c.json.Get(ctx, "/fees?cents="+strconv.FormatInt(int64(subtotal), 10), &payload)
	if err != nil {
		return 0, err
	}
	if status != http.StatusOK {
		return 0, fmt.Errorf("payments status %d", status)
	}
	if payload.Fee == nil || payload.Fee.Validate() != nil {
		return 0, fmt.Errorf("invalid upstream fee")
	}
	return *payload.Fee, nil
}

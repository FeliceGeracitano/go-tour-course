package identity

import (
	"context"
	"fmt"
	"net/http"
	"net/url"

	"example.com/large-service/internal/integrations/httpjson"
)

type Client struct{ json *httpjson.Client }

func New(base string, client *http.Client) (*Client, error) {
	json, err := httpjson.New(base, client)
	if err != nil {
		return nil, err
	}
	return &Client{json: json}, nil
}

func (c *Client) LookupName(ctx context.Context, id string) (string, bool, error) {
	var payload struct {
		Name string `json:"name"`
	}
	status, err := c.json.Get(ctx, "/customers/"+url.PathEscape(id), &payload)
	if err != nil {
		return "", false, err
	}
	if status == http.StatusNotFound {
		return "", false, nil
	}
	if status != http.StatusOK {
		return "", false, fmt.Errorf("identity status %d", status)
	}
	if payload.Name == "" {
		return "", false, fmt.Errorf("identity omitted name")
	}
	return payload.Name, true, nil
}

func (c *Client) Exists(ctx context.Context, id string) (bool, error) {
	_, found, err := c.LookupName(ctx, id)
	return found, err
}

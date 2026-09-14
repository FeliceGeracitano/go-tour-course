// Package httpjson owns bounded JSON GET mechanics, not business policy.
package httpjson

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type Client struct {
	base string
	http *http.Client
}

func New(base string, client *http.Client) (*Client, error) {
	u, err := url.Parse(base)
	if err != nil || u.Host == "" || (u.Scheme != "http" && u.Scheme != "https") || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") {
		return nil, fmt.Errorf("upstream URL must be an http(s) origin")
	}
	if client == nil {
		return nil, fmt.Errorf("HTTP client is required")
	}
	return &Client{base: u.Scheme + "://" + u.Host, http: client}, nil
}

// Get returns an HTTP status. Only a 200 response is decoded.
func (c *Client) Get(ctx context.Context, path string, dst any) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+path, nil)
	if err != nil {
		return 0, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return 0, fmt.Errorf("upstream request: %w", err)
	}
	defer resp.Body.Close()
	const limit = 64 << 10
	body, err := io.ReadAll(io.LimitReader(resp.Body, limit+1))
	if err != nil {
		return resp.StatusCode, err
	}
	if len(body) > limit {
		return resp.StatusCode, fmt.Errorf("upstream response exceeds %d bytes", limit)
	}
	if resp.StatusCode != http.StatusOK {
		return resp.StatusCode, nil
	}
	if err := json.Unmarshal(body, dst); err != nil {
		return resp.StatusCode, fmt.Errorf("upstream JSON: %w", err)
	}
	return resp.StatusCode, nil
}

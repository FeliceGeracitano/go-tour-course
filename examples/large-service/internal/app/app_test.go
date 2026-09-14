package app_test

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"example.com/large-service/internal/app"
	"example.com/large-service/internal/demoupstream"
	"example.com/large-service/internal/integrations/identity"
)

func newApp(t *testing.T, upstream http.Handler) *app.Application {
	t.Helper()
	server := httptest.NewServer(upstream)
	t.Cleanup(server.Close)
	application, err := app.New(app.Config{IdentityURL: server.URL, PaymentsURL: server.URL}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(application.Close)
	return application
}

func TestRoutes(t *testing.T) {
	application := newApp(t, demoupstream.Handler())
	for _, tc := range []struct {
		method, path string
		status       int
		contains     string
	}{
		{"GET", "/health", 200, `"status":"ok"`},
		{"GET", "/customers/c1", 200, `"name":"Ada"`},
		{"GET", "/customers/missing", 404, `"error":"customer not found"`},
		{"GET", "/billing/quote?cents=1000", 200, `"total_cents":1025`},
		{"GET", "/orders/quote?customer_id=c1&cents=1000", 200, `"customer_id":"c1"`},
		{"GET", "/orders/quote?customer_id=missing&cents=1000", 404, `"error"`},
		{"GET", "/orders/quote?customer_id=c1&cents=-1", 400, `"error"`},
		{"GET", "/orders/quote?customer_id=c1&customer_id=c2&cents=1", 400, `"error"`},
		{"GET", "/billing/quote?cents=1&cents=2", 400, `"error"`},
		{"GET", "/billing/quote?cents=99999999999999999999999999", 400, `"error"`},
		{"POST", "/orders/quote?customer_id=c1&cents=1000", 405, "Method Not Allowed"},
	} {
		t.Run(tc.path+tc.method, func(t *testing.T) {
			w := httptest.NewRecorder()
			application.Handler.ServeHTTP(w, httptest.NewRequest(tc.method, tc.path, nil))
			if w.Code != tc.status || !strings.Contains(w.Body.String(), tc.contains) {
				t.Fatalf("%d %s", w.Code, w.Body.String())
			}
			if tc.status != 405 && w.Header().Get("Content-Type") != "application/json" {
				t.Fatal("missing JSON type")
			}
		})
	}
}

func TestUpstreamFailures(t *testing.T) {
	for _, tc := range []struct {
		name   string
		status int
		body   string
	}{
		{"unavailable", 503, "sensitive upstream detail"},
		{"malformed", 200, "not json"},
		{"missing fee", 200, `{}`},
		{"negative fee", 200, `{"fee_cents":-1}`},
		{"oversized", 200, strings.Repeat("x", (64<<10)+1)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			application := newApp(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
				_, _ = io.WriteString(w, tc.body)
			}))
			w := httptest.NewRecorder()
			application.Handler.ServeHTTP(w, httptest.NewRequest("GET", "/billing/quote?cents=1000", nil))
			if w.Code != 502 || strings.TrimSpace(w.Body.String()) != `{"error":"upstream unavailable"}` {
				t.Fatalf("%d %s", w.Code, w.Body.String())
			}
		})
	}
}

func TestSharedClientConcurrentRoutes(t *testing.T) {
	application := newApp(t, demoupstream.Handler())
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Go(func() {
			for _, path := range []string{"/customers/c1", "/orders/quote?customer_id=c1&cents=1000"} {
				w := httptest.NewRecorder()
				application.Handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
				if w.Code != 200 {
					t.Errorf("%s: %d", path, w.Code)
				}
			}
		})
	}
	wg.Wait()
}

func TestRequestDeadlineMapsToGatewayTimeout(t *testing.T) {
	application := newApp(t, demoupstream.Handler())
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(-time.Second))
	defer cancel()
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/customers/c1", nil).WithContext(ctx)
	application.Handler.ServeHTTP(w, r)
	if w.Code != 504 {
		t.Fatalf("%d %s", w.Code, w.Body.String())
	}
}

func TestIdentityCancellation(t *testing.T) {
	upstream := httptest.NewServer(demoupstream.Handler())
	defer upstream.Close()
	client, err := identity.New(upstream.URL, upstream.Client())
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err = client.Exists(ctx, "c1")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("got %v", err)
	}
}

func TestConfigurationRejectsInvalidOrigins(t *testing.T) {
	for _, origin := range []string{"", "ftp://example.com", "https://example.com/path", "https://user:pass@example.com"} {
		if a, err := app.New(app.Config{IdentityURL: origin, PaymentsURL: origin}, nil); err == nil {
			a.Close()
			t.Fatalf("accepted %q", origin)
		}
	}
}

func TestQuoteResponse(t *testing.T) {
	application := newApp(t, demoupstream.Handler())
	w := httptest.NewRecorder()
	application.Handler.ServeHTTP(w, httptest.NewRequest("GET", "/orders/quote?customer_id=c1&cents=1000", nil))
	var got struct {
		CustomerID string `json:"customer_id"`
		Price      struct {
			Total int `json:"total_cents"`
		} `json:"price"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got.CustomerID != "c1" || got.Price.Total != 1025 {
		t.Fatalf("%+v", got)
	}
}

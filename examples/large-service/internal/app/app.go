// Package app is the composition root: it constructs and owns shared resources.
package app

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"example.com/large-service/internal/billing"
	"example.com/large-service/internal/customers"
	"example.com/large-service/internal/integrations/identity"
	"example.com/large-service/internal/integrations/payments"
	"example.com/large-service/internal/observability"
	"example.com/large-service/internal/orders"
	"example.com/large-service/internal/transport/httpapi"
)

type Config struct{ IdentityURL, PaymentsURL string }

func FromEnv() Config {
	return Config{IdentityURL: os.Getenv("IDENTITY_URL"), PaymentsURL: os.Getenv("PAYMENTS_URL")}
}

type Application struct {
	API       *httpapi.API
	Handler   http.Handler
	transport *http.Transport
}

func New(config Config, log *slog.Logger) (*Application, error) {
	if log == nil {
		log = slog.Default()
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	client := &http.Client{
		Transport:     transport,
		Timeout:       2 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	identityClient, err := identity.New(config.IdentityURL, client)
	if err != nil {
		transport.CloseIdleConnections()
		return nil, err
	}
	paymentsClient, err := payments.New(config.PaymentsURL, client)
	if err != nil {
		transport.CloseIdleConnections()
		return nil, err
	}
	customerService := customers.New(identityClient)
	billingService := billing.New(paymentsClient)
	orderService := orders.New(identityClient, billingService)
	api := httpapi.New(customerService, billingService, orderService, log)
	mux := http.NewServeMux()
	api.Register(mux)
	return &Application{API: api, Handler: observability.Requests(log, mux), transport: transport}, nil
}

// Close is called after incoming requests have drained.
func (a *Application) Close() { a.transport.CloseIdleConnections() }

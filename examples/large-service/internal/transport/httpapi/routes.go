package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"example.com/large-service/internal/billing"
	"example.com/large-service/internal/customers"
	"example.com/large-service/internal/money"
	"example.com/large-service/internal/orders"
)

type API struct {
	customers *customers.Service
	billing   *billing.Service
	orders    *orders.Service
	log       *slog.Logger
}

func New(c *customers.Service, b *billing.Service, o *orders.Service, log *slog.Logger) *API {
	return &API{customers: c, billing: b, orders: o, log: log}
}

// Register keeps route ownership visible at startup.
func (a *API) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", a.Health)
	a.registerCustomers(mux)
	a.registerBilling(mux)
	a.registerOrders(mux)
}

func (a *API) Health(w http.ResponseWriter, r *http.Request) {
	a.respond(w, r, map[string]string{"status": "ok"}, nil)
}

func (a *API) respond(w http.ResponseWriter, r *http.Request, value any, err error) {
	status := http.StatusOK
	if err != nil {
		message := "internal error"
		switch {
		case errors.Is(err, context.DeadlineExceeded):
			status, message = 504, "upstream timeout"
		case errors.Is(err, context.Canceled):
			status, message = 408, "request canceled"
		case errors.Is(err, customers.ErrInvalid), errors.Is(err, money.ErrInvalid):
			status, message = 400, "invalid input"
		case errors.Is(err, customers.ErrNotFound):
			status, message = 404, "customer not found"
		case errors.Is(err, customers.ErrUnavailable), errors.Is(err, billing.ErrUnavailable):
			status, message = 502, "upstream unavailable"
		}
		value = map[string]string{"error": message}
		a.log.ErrorContext(r.Context(), "request failed", "method", r.Method, "error", err)
	}
	body, marshalErr := json.Marshal(value)
	if marshalErr != nil {
		http.Error(w, "internal error", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := w.Write(append(body, 10)); err != nil {
		a.log.ErrorContext(r.Context(), "write response", "error", err)
	}
}

func amount(r *http.Request) (money.Amount, error) {
	values := r.URL.Query()["cents"]
	if len(values) != 1 {
		return 0, money.ErrInvalid
	}
	n, err := strconv.ParseInt(values[0], 10, 64)
	if err != nil {
		return 0, money.ErrInvalid
	}
	value := money.Amount(n)
	return value, value.Validate()
}

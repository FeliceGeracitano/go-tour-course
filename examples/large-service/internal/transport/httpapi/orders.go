package httpapi

import (
	"net/http"

	"example.com/large-service/internal/customers"
)

func (a *API) registerOrders(mux *http.ServeMux) {
	mux.HandleFunc("GET /orders/quote", a.OrderQuote)
}

func (a *API) OrderQuote(w http.ResponseWriter, r *http.Request) {
	subtotal, err := amount(r)
	if err != nil {
		a.respond(w, r, nil, err)
		return
	}
	ids := r.URL.Query()["customer_id"]
	if len(ids) != 1 {
		a.respond(w, r, nil, customers.ErrInvalid)
		return
	}
	quote, err := a.orders.Quote(r.Context(), ids[0], subtotal)
	a.respond(w, r, quote, err)
}

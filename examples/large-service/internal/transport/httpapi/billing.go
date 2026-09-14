package httpapi

import "net/http"

func (a *API) registerBilling(mux *http.ServeMux) {
	mux.HandleFunc("GET /billing/quote", a.BillingQuote)
}

func (a *API) BillingQuote(w http.ResponseWriter, r *http.Request) {
	subtotal, err := amount(r)
	if err != nil {
		a.respond(w, r, nil, err)
		return
	}
	quote, err := a.billing.Quote(r.Context(), subtotal)
	a.respond(w, r, quote, err)
}

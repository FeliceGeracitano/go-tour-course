package httpapi

import "net/http"

func (a *API) registerCustomers(mux *http.ServeMux) {
	mux.HandleFunc("GET /customers/{id}", a.Customer)
}

func (a *API) Customer(w http.ResponseWriter, r *http.Request) {
	customer, err := a.customers.Get(r.Context(), r.PathValue("id"))
	a.respond(w, r, customer, err)
}

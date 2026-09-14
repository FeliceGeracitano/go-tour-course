// Package withchi is an optional router adapter; domains have no chi dependency.
package withchi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"example.com/large-service/internal/observability"
	"example.com/large-service/internal/transport/httpapi"
)

func Router(api *httpapi.API, log *slog.Logger) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.GetHead)
	router.Get("/health", api.Health)
	router.Route("/customers", func(r chi.Router) {
		r.Get("/{id}", func(w http.ResponseWriter, r *http.Request) {
			r.SetPathValue("id", chi.URLParam(r, "id"))
			api.Customer(w, r)
		})
	})
	router.Route("/billing", func(r chi.Router) { r.Get("/quote", api.BillingQuote) })
	router.Route("/orders", func(r chi.Router) { r.Get("/quote", api.OrderQuote) })
	return observability.Requests(log, router)
}

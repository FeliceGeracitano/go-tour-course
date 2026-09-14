// Package demoupstream is a local simulator, not an identity or payment service.
package demoupstream

import (
	"encoding/json"
	"net/http"
)

func Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /customers/{id}", func(w http.ResponseWriter, r *http.Request) {
		if r.PathValue("id") != "c1" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"name": "Ada"})
	})
	mux.HandleFunc("GET /fees", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"fee_cents": 25})
	})
	return mux
}

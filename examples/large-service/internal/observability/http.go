// Package observability contains HTTP instrumentation shared by every route.
package observability

import (
	"log/slog"
	"net/http"
	"time"
)

func Requests(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.InfoContext(r.Context(), "request completed", "method", r.Method, "duration", time.Since(start))
	})
}

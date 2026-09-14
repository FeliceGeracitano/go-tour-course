package withchi

import (
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"

	"example.com/large-service/internal/app"
	"example.com/large-service/internal/demoupstream"
)

func TestRouterMatchesStandardEndpoints(t *testing.T) {
	upstream := httptest.NewServer(demoupstream.Handler())
	defer upstream.Close()
	log := slog.New(slog.NewTextHandler(io.Discard, nil))
	application, err := app.New(app.Config{IdentityURL: upstream.URL, PaymentsURL: upstream.URL}, log)
	if err != nil {
		t.Fatal(err)
	}
	defer application.Close()
	router := Router(application.API, log)
	for _, path := range []string{"/health", "/customers/c1", "/customers/missing", "/orders/quote?customer_id=c1&cents=1000", "/billing/quote?cents=1000", "/billing/quote?cents=-1"} {
		standard, chi := httptest.NewRecorder(), httptest.NewRecorder()
		application.Handler.ServeHTTP(standard, httptest.NewRequest("GET", path, nil))
		router.ServeHTTP(chi, httptest.NewRequest("GET", path, nil))
		if standard.Code != chi.Code || standard.Body.String() != chi.Body.String() {
			t.Fatalf("%s: standard %d %s, chi %d %s", path, standard.Code, standard.Body, chi.Code, chi.Body)
		}
	}
}

# Test the boundaries, then choose frameworks

The runnable example has three implementations of startup or routing: the default API
uses the standard library, api-chi replaces routing, and api-fx replaces lifecycle wiring.
All three reuse the same services and external adapters. chi and Fx solve different
problems; neither determines which domain owns a business rule.

## Test behavior at each boundary

The orders tests supply small function-backed fakes. One verifies that a missing customer
prevents any pricing call; another verifies context propagation and wrapped cancellation.
These tests need neither a web server nor a mocking framework.

```annotate
code: |
  // Source: examples/large-service/internal/orders/service_test.go
  func TestMissingCustomerDoesNotRequestPrice(t *testing.T) {
      directory := directoryFunc(func(context.Context, string) (bool, error) { return false, nil })
      pricing := quoteFunc(func(context.Context, money.Amount) (billing.Quote, error) {
          t.Fatal("pricing called for missing customer")
          return billing.Quote{}, nil
      })
      _, err := New(directory, pricing).Quote(context.Background(), "missing", 1000)
      if !errors.Is(err, customers.ErrNotFound) {
          t.Fatalf("got %v", err)
      }
  }
hotspots: [{"line": 3, "match": "return false, nil", "title": "Model absence explicitly", "note": "An unknown customer is distinct from a failed identity lookup."}, {"line": 5, "match": "t.Fatal", "title": "Assert a business consequence", "note": "Pricing must not be requested for a customer that does not exist."}, {"line": 9, "match": "errors.Is", "title": "Check the stable error contract", "note": "Callers can classify the result without matching an error string."}]
```

Integration tests use httptest.NewServer for provider HTTP behavior and send requests
through the fully assembled app. They cover successful quotes, invalid and duplicate
parameters, missing customers, malformed or oversized upstream responses, omitted or
negative fees, deadlines, and concurrent use. Framework tests compare chi responses with
the standard router and start/stop a real Fx-managed listener, including a bind failure.

From the example directory:

```bash
go test -race -count=1 -timeout=30s ./...
go vet ./...
go build ./...
```

From client, npm run check:go -- --race runs these checks too. Source-marked lesson
snippets are checked against the real files, so an annotation cannot silently drift from
the compiled example. The Go checker needs Go installed; reading the website does not.

## chi: change the router

[chi](https://github.com/go-chi/chi) supports route groups and standard HTTP handlers.
The adapter below changes route declarations and bridges path parameters to the existing
handler. Domain services do not import chi. The variant preserves the example's GET
endpoint behavior; routers can still differ in default 404/405 bodies and other details.

```annotate
code: |
  // Source: examples/large-service/internal/withchi/router.go
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
hotspots: [{"line": 6, "match": "router.Route(\"/customers\"", "title": "Group routes", "note": "Attach future group-specific middleware at this boundary."}, {"line": 8, "match": "r.SetPathValue", "title": "Translate the router boundary", "note": "The existing customer handler continues to read the standard request PathValue."}, {"line": 13, "match": "api.OrderQuote", "title": "Reuse business behavior", "note": "Router choice does not change the order workflow or its dependencies."}]
```

## Fx: change construction and lifetime management

[Uber Fx](https://uber-go.github.io/fx/) builds dependency graphs from constructors and
manages startup/shutdown hooks. This example deliberately keeps the explicit construction
inside app.New, with a thin Fx adapter around application and server lifetime.

```annotate
code: |
  // Source: examples/large-service/cmd/api-fx/main.go
  func main() {
      fx.New(
          fx.Provide(app.FromEnv, slog.Default),
          fx.Supply(withfx.ListenAddress("127.0.0.1:8080")),
          withfx.Module,
      ).Run()
  }
hotspots: [{"line": 4, "match": "fx.Provide", "title": "Register constructors", "note": "Fx constructs configuration and the logger when the module needs them."}, {"line": 5, "match": "fx.Supply", "title": "Provide a configured value", "note": "The named ListenAddress type distinguishes this string dependency."}, {"line": 6, "match": "withfx.Module", "title": "Install the lifecycle adapter", "note": "The module constructs the application and server, then invokes a consumer so the graph is instantiated."}]
```

The adapter binds the listener synchronously in OnStart, so a port conflict fails startup.
It serves in a goroutine and drains incoming requests in OnStop. Application cleanup was
registered first; Fx's reverse stop order shuts the server down before closing shared
outbound connections. An unexpected Serve failure requests application shutdown.
See [Fx lifecycle guidance](https://uber-go.github.io/fx/get-started/http-server.html)
and [module guidance](https://uber-go.github.io/fx/modules.html).

In a larger Fx application, you could register individual domain constructors and their
interface bindings. The tradeoff is less repetitive wiring but more runtime graph
configuration to understand and test. Fx modules are application composition units;
they are not the versioned Go modules defined by go.mod. Keep useful constructors callable
without Fx so a framework migration does not require rewriting business logic.

With the simulator running and the same environment variables from lesson one, stop
api and run either go run ./cmd/api-chi or go run ./cmd/api-fx. Each uses port 8080, so
run one API variant at a time. Dependencies are pinned in go.mod/go.sum; only the optional
variant packages import chi or Fx. The main API's dependency graph uses the standard library.

Start with explicit constructors. Choose chi when route composition helps; consider Fx
when repeated construction and lifetime wiring become a maintenance problem. Keep the
package contracts and behavioral tests whichever tools you choose.

```quiz
{
  "type": "mcq",
  "question": "Which change requires rewriting orders.Quote?",
  "options": [
    "Replacing ServeMux with chi",
    "Replacing startup with Fx",
    "Neither, when adapters preserve the contracts"
  ],
  "answer": 2,
  "explain": "HTTP routing and lifecycle composition sit outside domain behavior."
}
```

```quiz
{
  "type": "mcq",
  "question": "What should an Fx HTTP OnStart hook do before returning success?",
  "options": [
    "Bind the listener and report any bind error",
    "Start a goroutine that may fail to bind later"
  ],
  "answer": 0,
  "explain": "Synchronous binding prevents the application reporting successful startup while its port is unavailable."
}
```

# Multiple endpoints with one application

The service exposes four GET endpoints. Customer lookup and billing quotes are useful
independently; the order quote combines both capabilities. The transport layer owns
URLs, HTTP parameters, JSON, and status codes. Services own business validation and
can be called without an HTTP request.

| Endpoint | Behavior |
| --- | --- |
| /health | Process liveness; does not probe upstream health |
| /customers/{id} | Fetch a customer name |
| /billing/quote?cents=1000 | Quote a fee and total in USD cents |
| /orders/quote?customer_id=c1&cents=1000 | Validate the customer and quote an order |

## Register routes by domain

The standard-library implementation uses method-aware ServeMux patterns, available
since Go 1.22. The course baseline is Go 1.25+. GET patterns also match HEAD.
Separate files in httpapi organize each domain's endpoints without creating a package
for every handler. A startup registration method makes the whole route table discoverable.

```annotate
code: |
  // Source: examples/large-service/internal/transport/httpapi/routes.go
  func (a *API) Register(mux *http.ServeMux) {
      mux.HandleFunc("GET /health", a.Health)
      a.registerCustomers(mux)
      a.registerBilling(mux)
      a.registerOrders(mux)
  }
hotspots: [{"line": 3, "match": "GET /health", "title": "An explicit method and path", "note": "A method-aware pattern lets the router reject unsupported methods."}, {"line": 4, "match": "a.registerCustomers", "title": "Group by capability", "note": "Customer route declarations live together in customers.go."}, {"line": 6, "match": "a.registerOrders", "title": "One assembled API", "note": "All routes use the already constructed service instances."}]
```

## A thin handler still has responsibilities

```annotate
code: |
  // Source: examples/large-service/internal/transport/httpapi/orders.go
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
hotspots: [{"line": 3, "match": "amount(r)", "title": "Parse the transport representation", "note": "Reject missing, duplicate, malformed, negative, or out-of-range cents before calling the service."}, {"line": 9, "match": "len(ids) != 1", "title": "Reject ambiguous input", "note": "Duplicate customer_id parameters are not silently resolved by taking the first one."}, {"line": 13, "match": "r.Context()", "title": "Propagate request lifetime", "note": "The same context follows the workflow into upstream HTTP requests."}]
```

The handler delegates business behavior to orders.Quote and sends its result through
respond. Validation also lives in the services where callers outside HTTP need it:
transport parsing cannot guarantee that every future caller passes a valid Amount.

The response mapper uses errors.Is: invalid input becomes 400, missing customers 404,
upstream failure 502, and an upstream deadline 504. Wrapped causes remain available for
classification. Internal details are logged rather than copied into the JSON error.
Cancellation maps to 408 if a response can still be written; a disconnected caller may
never receive that response. Route misses and unsupported methods retain the router's
own default responses, which are not this application's JSON envelope.

Request logging wraps the assembled router once. Request timing logs record method and duration, omitting the URL.
The response mapper separately logs errors for diagnosis. Authentication and authorization would
need explicit policy before exposing the example beyond local learning. A health response
only means that this process can answer a request.

When routing becomes more elaborate, a router can replace the registration layer while
the services remain unchanged. The final lesson demonstrates the same endpoints with chi.
Read the [ServeMux pattern rules](https://pkg.go.dev/net/http#ServeMux).

```quiz
{
  "type": "mcq",
  "question": "Where should a cents query string become a money.Amount?",
  "options": [
    "The HTTP transport, followed by domain validation",
    "Inside the external payment provider",
    "In a global variable"
  ],
  "answer": 0,
  "explain": "HTTP parsing belongs at the transport boundary; the domain still protects its own invariants."
}
```

```quiz
{
  "type": "mcq",
  "question": "What does GET /health prove in this example?",
  "options": [
    "Identity and payments are healthy",
    "The process can answer this liveness request"
  ],
  "answer": 1,
  "explain": "Liveness and dependency readiness are separate contracts."
}
```

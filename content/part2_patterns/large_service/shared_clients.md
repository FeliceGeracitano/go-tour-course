# Shared external clients and resource ownership

Both customers and orders need identity information. Creating a client in every handler
would scatter configuration and make connection reuse difficult. Instead app constructs
one identity adapter, injects it into both services, and keeps it alive for the application.

The example also constructs a payments adapter. Both borrow one configured HTTP client
and transport because their connection policy is the same. HTTP clients and transports
are safe for concurrent requests and should be reused according to the
[standard-library documentation](https://pkg.go.dev/net/http#hdr-Clients_and_Transports).
That promise does not automatically make every third-party SDK safe to share: check its
concurrency contract and synchronize any mutable state you add.

## Construct once, inject explicitly

```annotate
code: |
  // Source: examples/large-service/internal/app/app.go
  func New(config Config, log *slog.Logger) (*Application, error) {
      if log == nil {
          log = slog.Default()
      }
      transport := http.DefaultTransport.(*http.Transport).Clone()
      client := &http.Client{
          Transport:     transport,
          Timeout:       2 * time.Second,
          CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
      }
      identityClient, err := identity.New(config.IdentityURL, client)
      if err != nil {
          transport.CloseIdleConnections()
          return nil, err
      }
      paymentsClient, err := payments.New(config.PaymentsURL, client)
      if err != nil {
          transport.CloseIdleConnections()
          return nil, err
      }
      customerService := customers.New(identityClient)
      billingService := billing.New(paymentsClient)
      orderService := orders.New(identityClient, billingService)
      api := httpapi.New(customerService, billingService, orderService, log)
      mux := http.NewServeMux()
      api.Register(mux)
      return &Application{API: api, Handler: observability.Requests(log, mux), transport: transport}, nil
  }
hotspots: [{"line": 9, "match": "Timeout:", "title": "Bound outbound calls", "note": "Each outbound request has a two-second client timeout; an earlier request-context deadline wins."}, {"line": 22, "match": "customers.New(identityClient)", "title": "Share one concrete adapter", "note": "Customers sees LookupName through its consumer-owned interface."}, {"line": 24, "match": "orders.New(identityClient, billingService)", "title": "A second view of the same instance", "note": "Orders sees Exists and delegates pricing to the same billing service used by billing endpoints."}]
```

No service looks up dependencies in a global registry or hides them in context values.
Constructors say what a service needs; context carries request lifetime. Configure the
client before concurrent use and avoid mutating its fields while requests are running.
Different credentials, cookie state, proxies, or isolation requirements can justify
separate clients or transports. Sharing is a deliberate policy choice, not a requirement
to use one universal client throughout every domain.

The JSON adapter uses NewRequestWithContext, closes response bodies, limits response
size to 64 KiB, and rejects malformed JSON. It reads bounded error responses too, which
allows connection reuse when the body fits. Redirects are returned to the adapter as
non-success statuses rather than followed. Only configuration supplies upstream origins;
request parameters cannot choose the host.

Identity interprets 404 as absence and treats other unexpected statuses as errors.
Payments validates that fee_cents is present and in range. Provider payloads stay inside
the adapters; services receive stable behavior and domain values. The adapters do not
retry. In a real integration, retry budgets and idempotency must follow the operation's
semantics, especially before adding any operation that charges money.

During shutdown, the server stops accepting requests and allows in-flight handlers up
to five seconds to finish. Only then does app close idle outbound connections. An
individual domain borrows the client and must not close it after a request. The client
timeout bounds each outbound call, not the sum of a multi-call workflow; an overall
workflow deadline can impose a tighter request budget.

```quiz
{
  "type": "mcq",
  "question": "Who closes the shared transport?",
  "options": [
    "Every domain after each call",
    "The application owner, after requests drain"
  ],
  "answer": 1,
  "explain": "Closing a borrowed dependency would interfere with other consumers."
}
```

```quiz
{
  "type": "mcq",
  "question": "Should every external SDK instance automatically be shared concurrently?",
  "options": [
    "Yes, because net/http is concurrency-safe",
    "Only if the SDK and added state support concurrent use"
  ],
  "answer": 1,
  "explain": "Concurrency safety of the underlying transport does not guarantee safety of a wrapper."
}
```

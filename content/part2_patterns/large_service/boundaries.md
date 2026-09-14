# Structuring a large Go service

A growing API needs boundaries that help people change one business capability without
understanding every endpoint. This six-lesson chapter builds one runnable quote service:
customers retrieves a name, billing calculates a quoted total, and orders coordinates
customer eligibility with billing. These operations are read-only. A quote never creates
an order or charges a card.

Start after **Module layout** and **Small, consumer-side interfaces**. Go's official
[layout guidance](https://go.dev/doc/modules/layout) recommends cmd and internal for
servers. The domain boundaries here are a design example, not a mandated Go template.
One module is enough; a package boundary does not require another go.mod.

## A concrete package map

```text
examples/large-service/
  go.mod
  cmd/api/                    startup and signals
  cmd/demo-upstream/          local identity/payment simulator
  internal/app/              configuration, wiring, resource ownership
  internal/customers/        customer lookup rules and contracts
  internal/billing/          fee and total rules
  internal/orders/           order quote workflow
  internal/transport/httpapi/ handlers and route registration
  internal/integrations/identity/  external identity protocol
  internal/integrations/payments/  external fee protocol
  internal/integrations/httpjson/  bounded JSON GET mechanics
  internal/money/            shared USD amount rules
  internal/observability/    shared request logging
```

Keep related functions together until a separate package makes a useful API boundary.
A large codebase does not need one package per endpoint or identical layers everywhere.
The small packages here make the teaching boundaries visible; a smaller service could
combine some of them.

## Explore dependency direction

```diagram
id: service-dependencies
```

The diagram distinguishes compile-time imports from runtime calls through interfaces.
For example, orders imports billing's quote type, but it never imports the concrete
payments client. app knows the concrete constructors and connects them. The identity
client satisfies both customers.Directory and orders.CustomerDirectory implicitly.

Root-level internal prevents unrelated importers from depending on these packages;
it does not stop sibling domains importing each other. Go rejects cycles, while code
review and dependency checks preserve the intended direction. Here orders can depend
on billing and customers; neither domain depends back on orders.

## Start at the executable

```annotate
code: |
  // Source: examples/large-service/cmd/api/main.go
  func run() error {
      application, err := app.New(app.FromEnv(), slog.Default())
      if err != nil {
          return err
      }
      defer application.Close()
      ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
      defer stop()
      slog.Info("starting server", "address", "127.0.0.1:8080")
      return app.Serve(ctx, app.Server("127.0.0.1:8080", application.Handler))
  }
hotspots: [{"line": 3, "match": "app.New", "title": "One construction point", "note": "Configuration and concrete dependencies are assembled before serving requests."}, {"line": 7, "match": "defer application.Close()", "title": "Own the lifetime", "note": "The application releases its transport after Serve has drained incoming requests."}, {"line": 11, "match": "app.Serve", "title": "Keep startup thin", "note": "Signals and process lifetime live outside the domain packages."}]
```

## Run the complete example

From the repository root, start the simulator in one terminal:

```bash
cd examples/large-service
go run ./cmd/demo-upstream
```

In a second terminal, also from the repository root:

```bash
cd examples/large-service
export IDENTITY_URL=http://127.0.0.1:9090
export PAYMENTS_URL=http://127.0.0.1:9090
go run ./cmd/api
```

Then request a quote:

```bash
curl 'http://127.0.0.1:8080/orders/quote?customer_id=c1&cents=1000'
```

The response contains customer c1, subtotal 1000, fee 25, and total 1025, all in USD
cents. Stop both processes with Ctrl-C. Missing configuration fails startup. The sample
binds to loopback and provides no authentication, database, or durable order workflow.
See the [complete source and run instructions](https://github.com/FeliceGeracitano/go-tour-course/tree/main/examples/large-service).

```quiz
{
  "type": "mcq",
  "question": "Does internal/ prevent orders from importing billing?",
  "options": [
    "Yes, all internal packages are isolated",
    "No; it restricts importers outside the parent tree"
  ],
  "answer": 1,
  "explain": "Domain boundaries inside this tree require intentional dependency direction. Go rejects import cycles, not all cross-domain imports."
}
```

```quiz
{
  "type": "mcq",
  "question": "Which package should construct the concrete external clients?",
  "options": [
    "Every HTTP handler",
    "app, during startup",
    "money"
  ],
  "answer": 1,
  "explain": "The composition root owns shared resources and injects them into consumers."
}
```

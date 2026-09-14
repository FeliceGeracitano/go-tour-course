# Large Go service: a runnable architecture example

A read-only quote API with customers, billing, and orders. The default application
uses only the Go standard library. Optional chi and Fx commands show routing and
lifecycle alternatives using the same domain code. Go 1.25+ is required.

## Run

From this directory, start the local provider simulator:

```bash
go run ./cmd/demo-upstream
```

In another terminal, from this directory:

```bash
export IDENTITY_URL=http://127.0.0.1:9090
export PAYMENTS_URL=http://127.0.0.1:9090
go run ./cmd/api
```

In a third terminal:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/customers/c1
curl 'http://127.0.0.1:8080/billing/quote?cents=1000'
curl 'http://127.0.0.1:8080/orders/quote?customer_id=c1&cents=1000'
```

The order response is:

```json
{"customer_id":"c1","price":{"subtotal_cents":1000,"fee_cents":25,"total_cents":1025}}
```

Unknown customers return 404. Invalid input returns 400. A failed provider returns
502; a provider deadline returns 504. The simulator knows only customer `c1` (Ada)
and always quotes a 25-cent fee. It never charges money. Stop the processes with
Ctrl-C. Configuration accepts HTTP(S) origins, with no path, credentials, or query.

The optional commands use the same environment and port, so stop the default API
before starting either alternative:

```bash
go run ./cmd/api-chi
# Or:
go run ./cmd/api-fx
```

chi v5.3.2 and Fx v1.24.0 are pinned in go.mod/go.sum. These dependencies are imported
only by the optional variant packages, not by cmd/api. `go test ./...` checks every
variant and will download their dependencies on first use.

## Boundaries

- `cmd/`: process entry points and signal handling (Fx handles signals for its variant).
- `internal/app`: concrete construction, HTTP transport ownership, graceful shutdown.
- `internal/customers`: name lookup contract, ID rules, absence semantics.
- `internal/billing`: fee contract and quoted total calculation.
- `internal/orders`: customer eligibility followed by billing; no writes or persistence.
- `internal/transport/httpapi`: route registration by domain, parsing, response mapping.
- `internal/integrations/{identity,payments}`: provider protocols and payload validation.
- `internal/integrations/httpjson`: bounded JSON GET mechanics shared by the adapters.
- `internal/money`: nonnegative USD cents, with a maximum of 100000000 cents.
- `internal/observability`: shared request timing/logging without query-string logging.
- `internal/withchi`, `internal/withfx`: optional routing and lifecycle adapters.
- `internal/demoupstream`: local simulator used by the demo command and tests.

Orders intentionally imports billing's quote type and customer validation/errors.
Billing and customers do not import orders. The identity client is constructed once
and satisfies two consumer-owned interfaces. Both provider adapters borrow one
configured HTTP client/transport; the app closes idle connections after draining
incoming requests. No domain uses global dependency lookup.

The Fx adapter wraps app.New rather than registering every domain separately. Its
hooks bind the listener synchronously, drain HTTP requests, and release the transport
in reverse registration order. Useful constructors remain callable without Fx.

## Verify

```bash
go test -race -count=1 -timeout=30s ./...
go vet ./...
go build ./...
```

Tests cover domain short-circuiting, wrapped cancellation, amount bounds, assembled
routes, malformed/oversized/unavailable provider responses, concurrent shared-client
calls, router parity, listener conflicts, and shutdown. They use local httptest
servers and fakes; no provider credentials or external APIs are needed.

From the repository's client directory, `npm run check:go -- --race` runs these
checks alongside the other lesson examples. Every lesson annotation headed
`// Source: examples/large-service/...` must match its source file (with indentation tabs expanded for Markdown). These
are contextual excerpts, not standalone programs to paste into a fresh main.go.

## Scope

This demonstrates package boundaries, not a production commerce platform. It binds
to loopback, has no authentication or database, and does not create orders, reserve
funds, or provide atomic multi-service transactions. Quotes can become stale between
calls. Real writes need explicit persistence, authorization, idempotency, and recovery
policies. Per-call HTTP timeouts do not constitute a total workflow deadline.

The package layout is an example informed by Go's guidance, not an official mandatory
architecture. Supporting sources are linked throughout the six course lessons.

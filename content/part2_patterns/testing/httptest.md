# httptest

Use httptest.ResponseRecorder to call a handler directly without a socket. Use
httptest.NewServer when testing an HTTP client or behavior that needs a real local
HTTP exchange. Both avoid relying on a separately running service.

A recorder is enough to assert status, headers, and body for a small handler. It does
not simulate every property of a network connection.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "net/http"
      "net/http/httptest"
      "testing"
  )

  func health(w http.ResponseWriter, r *http.Request) {
      w.Header().Set("Content-Type", "text/plain; charset=utf-8")
      fmt.Fprint(w, "ok")
  }
  func TestHealth(t *testing.T) {
      req := httptest.NewRequest(http.MethodGet, "/health", nil)
      rr := httptest.NewRecorder()
      health(rr, req)
      res := rr.Result()
      defer res.Body.Close()
      if res.StatusCode != http.StatusOK { t.Fatalf("status = %d", res.StatusCode) }
      if got := res.Header.Get("Content-Type"); got != "text/plain; charset=utf-8" {
          t.Errorf("content type = %q", got)
      }
      if got := rr.Body.String(); got != "ok" { t.Errorf("body = %q", got) }
  }
hotspots: [{"line": 15, "match": "httptest.NewRequest", "title": "Server-side request fixture", "note": "Build an incoming request suitable for a handler test."}, {"line": 18, "match": "rr.Result()", "title": "Inspect the response", "note": "Read the committed status and headers rather than assuming mutable recorder state is a wire response."}, {"line": 24, "match": "rr.Body.String()", "title": "Assert body semantics", "note": "For JSON, decode and compare relevant fields when whitespace or key order is not contractual."}]
```

## Test the boundary you mean

Save the example as health_test.go. Calling health directly tests that function; calling
`mux.ServeHTTP(rr, req)` also tests route matching, methods, and middleware registered on
the mux. Use the latter for a route-level contract.

For client tests, a NewServer handler can return controlled statuses, bodies, and delays.
Use its URL instead of a fixed port and register Close with t.Cleanup. NewTLSServer
provides a server and configured client for TLS-aware tests. These servers use real
loopback networking; they are local integration tests, not socket-free calls.

Test invalid JSON, oversize bodies, unexpected methods, and error statuses as well as
success. Keep timing assertions tolerant and coordinate slow responses explicitly rather
than depending on tiny sleeps. Streaming, flushing, and disconnect handling can need a
real test server instead of only a recorder.

## Check your understanding

```quiz
type: "mcq"
question: "Which option exercises the HTTP transport locally?"
options: ["Calling a handler with ResponseRecorder", "httptest.NewServer plus an HTTP client", "Only checking a function’s return value"]
answer: 1
explain: "NewServer starts a real local server, allowing client and transport behavior to be tested."
```

```quiz
type: "mcq"
question: "How do you include routing and middleware in a recorder test?"
options: ["Call the configured mux’s ServeHTTP", "Call only the innermost helper", "Compare the route string without making a request"]
answer: 0
explain: "Dispatching through the mux exercises the same registered handler chain."
```

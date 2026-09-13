# Client with timeouts

Reuse an http.Client for outbound calls and configure timeouts. The default client
has no overall timeout, and constructing a new transport for every request throws away
connection-pooling benefits.

Use a request context for the caller's lifetime and Client.Timeout as an additional
upper bound. This example calls a local test server, never an external API.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
      "io"
      "net/http"
      "net/http/httptest"
      "time"
  )

  func fetch(ctx context.Context, client *http.Client, url string) (string, error) {
      req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
      if err != nil { return "", err }
      resp, err := client.Do(req)
      if err != nil { return "", err }
      defer resp.Body.Close()
      if resp.StatusCode != http.StatusOK { return "", fmt.Errorf("upstream status %d", resp.StatusCode) }
      const limit = 1024
      body, err := io.ReadAll(io.LimitReader(resp.Body, limit+1))
      if err != nil { return "", err }
      if len(body) > limit { return "", fmt.Errorf("response too large") }
      return string(body), nil
  }

  func main() {
      upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
          fmt.Fprint(w, "tea")
      }))
      defer upstream.Close()
      client := &http.Client{Timeout: 2 * time.Second}
      ctx, cancel := context.WithTimeout(context.Background(), time.Second)
      defer cancel()
      text, err := fetch(ctx, client, upstream.URL)
      if err != nil { panic(err) }
      fmt.Println(text)
  }

  // Output:
  // tea
hotspots: [{"line": 13, "match": "http.NewRequestWithContext", "title": "Propagate cancellation", "note": "The request shares the caller’s deadline and cancellation signal."}, {"line": 17, "match": "defer resp.Body.Close()", "title": "Release the response", "note": "Successful Do calls return a body that the caller must close."}, {"line": 20, "match": "limit+1", "title": "Detect oversize rather than truncate silently", "note": "Read one extra byte so exceeding the budget is distinguishable from an exactly full response."}]
```

## Failure is more than a Go error

An HTTP 404 or 500 normally produces a Response with a nil Go error. Check the status
against the API's expected statuses separately. Network, protocol, or timeout failures
are reported through the error result.

Client.Timeout includes connection setup, redirects, and reading the response body.
Transport-specific timeouts can refine individual phases. Reading a body to EOF and
closing it helps connection reuse; for oversized or unwanted bodies, protecting the
resource budget can be more important than reuse. Do not drain an unbounded body merely
to save a connection.

Retries need a policy for attempts, backoff, overall deadline, and idempotency. Repeating
a payment request after an ambiguous network failure may create a duplicate operation
unless the API supplies an idempotency mechanism. A timeout is not proof that the server
did no work.

## Check your understanding

```quiz
type: "mcq"
question: "Does a 500 response necessarily make client.Do return a non-nil error?"
options: ["Yes", "No, check StatusCode separately", "Only when the response has JSON"]
answer: 1
explain: "HTTP error statuses are valid HTTP responses, distinct from transport failures."
```

```quiz
type: "mcq"
question: "Why read limit+1 bytes before checking the length?"
options: ["To detect that the body exceeds the limit", "To enlarge the response permanently", "To guarantee a reusable connection"]
answer: 0
explain: "Reading exactly limit bytes alone cannot distinguish an exact-size body from a truncated oversized one."
```

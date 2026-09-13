# Server with http.ServeMux

The standard http.ServeMux routes incoming requests to handlers. A handler receives a
ResponseWriter for its response and a Request for method, URL, headers, body, and context.
Create a dedicated mux so routes are explicit instead of relying on global registration.

The method-and-wildcard pattern syntax below requires Go 1.22 or newer. We exercise the
mux with httptest, so this complete example does not start a listening server.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "net/http"
      "net/http/httptest"
  )

  func main() {
      mux := http.NewServeMux()
      mux.HandleFunc("GET /products/{id}", func(w http.ResponseWriter, r *http.Request) {
          w.Header().Set("Content-Type", "text/plain; charset=utf-8")
          fmt.Fprint(w, "product "+r.PathValue("id"))
      })
      rr := httptest.NewRecorder()
      mux.ServeHTTP(rr, httptest.NewRequest("GET", "/products/42", nil))
      fmt.Println(rr.Code, rr.Body.String())
  }

  // Output:
  // 200 product 42
hotspots: [{"line": 11, "match": "GET /products/{id}", "title": "Method and path pattern", "note": "The named wildcard matches one path segment; GET patterns also match HEAD."}, {"line": 13, "match": "r.PathValue(\"id\")", "title": "Read the matched wildcard", "note": "Validate this string before using it as a domain identifier."}, {"line": 12, "match": "w.Header().Set", "title": "Set headers before writing", "note": "Writing the body implicitly sends status 200 if no status was written yet."}]
```

## From a mux to a server

To listen, construct `http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout:
5 * time.Second}` and handle the error from ListenAndServe. Production services also
need workload-appropriate limits, timeouts, observability, and shutdown behavior.
Do not confuse route matching with input validation or authorization.

A path ending in a slash can match a subtree; `{$}` anchors an exact end where needed.
More-specific compatible patterns take precedence. Conflicting registrations can panic,
so keep route construction covered by tests. The standard mux can distinguish “not
found” from “method not allowed” for method-qualified routes.

Handlers may run concurrently. Protect shared mutable state and use r.Context for work
belonging to that request. A ResponseWriter should not be retained and written after the
handler has returned. The graceful-shutdown lesson covers the server's lifetime.

## Check your understanding

```quiz
type: "mcq"
question: "When must Content-Type be set?"
options: ["Before WriteHeader or the first body write", "After the handler returns", "Only when status is not 200"]
answer: 0
explain: "Headers are committed by the status/body write; changing them afterward does not change the sent response."
```

```quiz
type: "mcq"
question: "Does a GET pattern also match HEAD requests in the modern mux?"
options: ["Yes", "No", "Only with a second explicit route"]
answer: 0
explain: "GET has the special matching behavior of including HEAD."
```

## Further reading

[ServeMux routing rules](https://pkg.go.dev/net/http#ServeMux)

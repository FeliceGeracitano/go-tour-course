# Middleware

Middleware wraps a handler with behavior that runs before or after the next handler.
Its common shape is `func(http.Handler) http.Handler`, which lets wrappers compose
without changing route implementations.

Order matters. The outermost wrapper sees a request first and finishes last. A wrapper
that rejects a request must return without calling the next handler.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "net/http"
      "net/http/httptest"
  )

  func mark(name string, next http.Handler) http.Handler {
      return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
          fmt.Println(name, "before")
          defer fmt.Println(name, "after")
          next.ServeHTTP(w, r)
      })
  }

  func main() {
      endpoint := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
          fmt.Fprint(w, "ok")
      })
      handler := mark("outer", mark("inner", endpoint))
      rr := httptest.NewRecorder()
      handler.ServeHTTP(rr, httptest.NewRequest("GET", "/", nil))
      fmt.Println(rr.Body.String())
  }

  // Output:
  // outer before
  // inner before
  // inner after
  // outer after
  // ok
hotspots: [{"line": 9, "match": "func mark(name string, next", "title": "Wrap a behavior", "note": "The wrapper accepts any Handler, including another middleware result."}, {"line": 12, "match": "defer fmt.Println", "title": "After the inner handler", "note": "Defers unwind in the opposite order to entering the wrapper chain."}, {"line": 13, "match": "next.ServeHTTP(w, r)", "title": "Continue exactly once", "note": "Omit this call after a rejection; calling twice can duplicate side effects."}]
```

## Keep wrappers honest

Header-setting middleware must set headers before invoking a handler that may write.
Authentication middleware should reject invalid credentials and return; writing a 401
and then calling next can execute the protected action anyway.

Response-status logging often wraps ResponseWriter. Such wrappers must account for an
implicit 200 on the first Write and for optional interfaces or ResponseController
behavior used by streaming and other handlers. A minimal wrapper can accidentally break
those capabilities. The example avoids wrapping ResponseWriter so composition is clear.

Share immutable configuration across requests. Mutable counters or caches inside a
middleware closure are shared between concurrent handlers and need synchronization.
Use request context for request-scoped data, and pass a derived request with
`r.WithContext(ctx)` to downstream code rather than mutating unrelated global state.

## Check your understanding

```quiz
type: "mcq"
question: "For outer(inner(endpoint)), which after action runs first?"
options: ["outer after", "inner after", "They must run concurrently"]
answer: 1
explain: "The inner call returns before the outer call, so its deferred action runs first."
```

```quiz
type: "mcq"
question: "A middleware writes status 401 for invalid credentials. What next?"
options: ["Call next anyway", "Return without calling next", "Write status 200 afterward"]
answer: 1
explain: "Rejecting the response must also prevent the protected handler from executing."
```

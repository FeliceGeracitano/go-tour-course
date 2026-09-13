# context cancellation

A context carries cancellation, deadlines, and request-scoped values across API
boundaries. Pass it as the first parameter, conventionally named ctx, to operations
that can be interrupted. Never use it as a bag of optional configuration.

Cancellation is cooperative: closing Done is a signal. Workers must observe it and
finish their own cleanup; callers may need a separate join to wait for that cleanup.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
  )

  func main() {
      ctx, cancel := context.WithCancel(context.Background())
      done := make(chan struct{})
      go func() {
          defer close(done)
          <-ctx.Done()
          fmt.Println(ctx.Err())
      }()
      cancel()
      <-done
      fmt.Println("joined")
  }

  // Output:
  // context canceled
  // joined
hotspots: [{"line": 9, "match": "context.WithCancel", "title": "Derive a child context", "note": "Cancelling this child does not cancel its parent."}, {"line": 13, "match": "<-ctx.Done()", "title": "Observe the signal", "note": "Done closes when the context is cancelled. Err explains why."}, {"line": 17, "match": "<-done", "title": "Join the worker", "note": "The cancellation call alone does not wait for the worker to exit."}]
```

## Propagate the lifetime

For HTTP work, start with `r.Context()` and pass it into database calls and outgoing
requests. Replacing it with context.Background inside a helper disconnects the work
from the request's lifetime. Background is appropriate at an application root, not as
an automatic substitute when a caller already provided a context.

`context.WithTimeout(parent, duration)` derives a deadline. Defer its cancel function
even if the operation succeeds quickly: that releases associated resources promptly.
Parent cancellation propagates to children; an earlier parent deadline still bounds a
child with a longer requested timeout.

Use context values only for request-scoped metadata that needs to cross API boundaries.
Use unexported key types to avoid collisions, and keep required business inputs as
explicit function arguments. Do not store a context in a long-lived service struct when
each method call has a different lifetime.

## Check your understanding

```quiz
type: "mcq"
question: "Does calling cancel wait until every worker has exited?"
options: ["Yes", "No, use a completion signal or group to join", "Only for WithTimeout"]
answer: 1
explain: "Cancellation signals intent; workers observe it asynchronously."
```

```quiz
type: "mcq"
question: "An HTTP helper uses context.Background instead of r.Context. What is lost?"
options: ["The caller’s cancellation and deadline chain", "All request headers automatically", "The ability to use goroutines"]
answer: 0
explain: "The new root context is independent of the incoming request."
```

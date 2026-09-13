# Rate limiting

Rate limiting controls how often work begins. A concurrency limit controls how many
operations are active at once. A service may need both: two slow operations at a time
and no more than a certain request rate.

A ticker is a simple pacing tool. Wait for each tick before starting the next operation,
and make the wait cancellable so shutdown does not hang.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
      "time"
  )

  func main() {
      ctx, cancel := context.WithCancel(context.Background())
      defer cancel()
      limiter := time.NewTicker(10 * time.Millisecond)
      defer limiter.Stop()
      for i := 1; i <= 3; i++ {
          select {
          case <-ctx.Done(): return
          case <-limiter.C:
              fmt.Println("request", i)
          }
      }
  }

  // Output:
  // request 1
  // request 2
  // request 3
hotspots: [{"line": 12, "match": "time.NewTicker", "title": "Periodic opportunity", "note": "The duration must be positive. This example waits before the first request too."}, {"line": 16, "match": "case <-ctx.Done():", "title": "Interrupt the pacing wait", "note": "The caller can stop before the next tick."}, {"line": 13, "match": "defer limiter.Stop()", "title": "Stop timer activity", "note": "Stopping a ticker does not close its channel; do not range over it expecting shutdown."}]
```

## Pacing, bursts, and scope

A ticker may drop ticks when the receiver is slow; it is not a queue of every elapsed
interval. It does not implement a configurable token bucket or strict minimum spacing
between every pair of operations. Use a token-bucket limiter such as
`golang.org/x/time/rate` when the policy needs a defined average rate and burst size.
Its Wait method can use the caller's context; Allow supports immediate rejection.

Choose the scope of the limit: per process, per tenant, per credential, or global.
A limiter in each of ten replicas does not enforce the same total budget as one global
limiter. A global policy needs coordination outside these independent processes.

Decide whether overload should queue or fail fast. Queues need size limits and deadlines.
Returning an explicit retryable response can be better than accumulating requests that
will time out anyway. Rate limiting also does not make a non-idempotent operation safe
to retry.

## Check your understanding

```quiz
type: "mcq"
question: "Does a two-worker pool guarantee at most two requests per second?"
options: ["Yes", "No, it bounds active work rather than starts per second", "Only for HTTP"]
answer: 1
explain: "Fast workers can complete many operations per second. Rate and concurrency are separate controls."
```

```quiz
type: "mcq"
question: "Does ticker.Stop close ticker.C?"
options: ["Yes", "No", "Only if a receiver is waiting"]
answer: 1
explain: "Use cancellation or another signal to terminate a receiver; Stop does not close the channel."
```

## Further reading

[Token-bucket limiter](https://pkg.go.dev/golang.org/x/time/rate)

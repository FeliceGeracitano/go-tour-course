# Fan-in / fan-out

Fan-out lets several workers consume one input stream. Fan-in merges several output
streams into one. They compose into parallel pipelines, but neither automatically
preserves input order.

A merge function needs a closing coordinator because several goroutines can send to
its output. Each forwarding goroutine must also be able to stop when downstream cancels.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
      "slices"
      "sync"
  )

  func merge(ctx context.Context, inputs ...<-chan int) <-chan int {
      out := make(chan int)
      var wg sync.WaitGroup
      for _, in := range inputs {
          wg.Add(1)
          go func(in <-chan int) {
              defer wg.Done()
              for {
                  select {
                  case <-ctx.Done(): return
                  case n, ok := <-in:
                      if !ok { return }
                      select { case out <- n: case <-ctx.Done(): return }
                  }
              }
          }(in)
      }
      go func() { wg.Wait(); close(out) }()
      return out
  }

  func main() {
      ctx, cancel := context.WithCancel(context.Background())
      defer cancel()
      a, b := make(chan int, 1), make(chan int, 1)
      a <- 2; close(a)
      b <- 1; close(b)
      var values []int
      for n := range merge(ctx, a, b) { values = append(values, n) }
      slices.Sort(values)
      fmt.Println(values)
  }

  // Output:
  // [1 2]
hotspots: [{"line": 10, "match": "inputs ...<-chan int", "title": "Accept several receive-only streams", "note": "The merger does not own or close its inputs."}, {"line": 15, "match": "go func(in <-chan int)", "title": "Forward one stream per goroutine", "note": "Each forwarder terminates on input close or cancellation."}, {"line": 27, "match": "wg.Wait(); close(out)", "title": "Close once after all forwarders", "note": "Receivers can range safely until every input has finished."}]
```

## Distribution is not broadcast

When several workers receive from one jobs channel, each sent value is received by one
worker. This is work distribution. Broadcasting every value to every subscriber requires
a different design with separate deliveries and a policy for slow subscribers.

The order within one channel is retained, but interleaving between different inputs is
unspecified. If a merge must restore input order, carry sequence numbers and buffer or
coordinate appropriately. That ordering can reduce parallelism and increase memory use.

The caller should pass a context shared with upstream producers; cancelling only the
merger can still leave an upstream sender blocked. The example's input channels are
already finite and closed, so it has no live upstream work. An empty input list also
works: the coordinator closes out after the zero-count WaitGroup returns.

## Check your understanding

```quiz
type: "mcq"
question: "Two workers receive from the same jobs channel. Does each job reach both?"
options: ["Yes, channels broadcast", "No, each job is received by one worker", "Only if the channel is buffered"]
answer: 1
explain: "Multiple receivers compete for values; broadcasting needs explicit separate deliveries."
```

```quiz
type: "mcq"
question: "What ordering does merge promise across a and b?"
options: ["All of a before all of b", "A deterministic round-robin order", "No fixed cross-input order"]
answer: 2
explain: "Scheduling and readiness determine interleaving. Carry indexes if order is part of the contract."
```

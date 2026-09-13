# Pipeline

A pipeline connects stages using channels. Each stage consumes one stream and produces
another, allowing computation to overlap. A useful stage has a clear input owner,
output-closing rule, and cancellation path.

This pipeline generates a finite sequence, doubles each value, and consumes the result.
Cancellation is wired through every send that might otherwise outlive its receiver.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
  )

  func source(ctx context.Context, values ...int) <-chan int {
      out := make(chan int)
      go func() {
          defer close(out)
          for _, n := range values {
              select { case out <- n: case <-ctx.Done(): return }
          }
      }()
      return out
  }
  func double(ctx context.Context, in <-chan int) <-chan int {
      out := make(chan int)
      go func() {
          defer close(out)
          for {
              select {
              case <-ctx.Done(): return
              case n, ok := <-in:
                  if !ok { return }
                  select { case out <- n * 2: case <-ctx.Done(): return }
              }
          }
      }()
      return out
  }

  func main() {
      ctx, cancel := context.WithCancel(context.Background())
      defer cancel()
      for n := range double(ctx, source(ctx, 2, 3)) { fmt.Println(n) }
  }

  // Output:
  // 4
  // 6
hotspots: [{"line": 11, "match": "defer close(out)", "title": "Stage owns its output", "note": "Only this stage sends on out, so it can announce completion safely."}, {"line": 26, "match": "if !ok { return }", "title": "Propagate end of stream", "note": "A closed input eventually closes the stage output too."}, {"line": 27, "match": "case out <- n * 2:", "title": "Cancellable output", "note": "This send must be able to stop if downstream stops receiving."}]
```

## Early termination travels upstream

If the consumer only needs the first result, it should cancel the shared context before
returning. Each producer observes cancellation and can abandon a blocked send. Cancelling
is a signal, not a join; add explicit waiting if the caller must observe teardown complete.

Every potentially blocking point needs an exit strategy. Checking context once before
an unconditional channel send is insufficient: cancellation can happen after the check
while the send is blocked. Put cancellation in the select containing that send.

Choose stage boundaries around useful operations, not every expression. Channels add
coordination overhead, and a direct function pipeline may be simpler for cheap sequential
work. Buffers can smooth bursts between stages but should not hide an ownership or
cancellation bug.

## Check your understanding

```quiz
type: "mcq"
question: "The consumer stops after one result. What should it signal?"
options: ["Cancellation to upstream stages", "Only a larger output buffer", "Nothing; goroutines stop automatically"]
answer: 0
explain: "Stages need a signal that receivers will no longer drain their outputs."
```

```quiz
type: "mcq"
question: "Why put ctx.Done in the same select as a send?"
options: ["To make the send faster", "To let cancellation release a blocked send", "To force the cancellation case to win every race"]
answer: 1
explain: "A separate pre-check cannot interrupt a send that blocks afterward."
```

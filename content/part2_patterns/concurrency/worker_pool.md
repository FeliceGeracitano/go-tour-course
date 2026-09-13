# Worker pool

A worker pool bounds how many jobs run simultaneously. Put jobs on a channel, start
a fixed number of workers, and collect results while the workers run. This limits CPU
or downstream pressure without starting an unbounded goroutine per input.

This finite example squares four values. Results may arrive in any order, so the
collector sorts them only for stable presentation.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "slices"
      "sync"
  )

  func main() {
      jobs := make(chan int)
      results := make(chan int)
      var wg sync.WaitGroup
      for i := 0; i < 2; i++ {
          wg.Add(1)
          go func() {
              defer wg.Done()
              for n := range jobs { results <- n * n }
          }()
      }
      go func() {
          defer close(jobs)
          for _, n := range []int{1, 2, 3, 4} { jobs <- n }
      }()
      go func() { wg.Wait(); close(results) }()
      var values []int
      for n := range results { values = append(values, n) }
      slices.Sort(values)
      fmt.Println(values)
  }

  // Output:
  // [1 4 9 16]
hotspots: [{"line": 13, "match": "i < 2", "title": "Bound execution", "note": "At most two workers process jobs at once."}, {"line": 24, "match": "wg.Wait(); close(results)", "title": "One closing coordinator", "note": "No worker closes the shared output while another can still send."}, {"line": 26, "match": "for n := range results", "title": "Collect concurrently", "note": "Waiting for workers before receiving unbuffered results would deadlock."}]
```

## Size the pool and define failure behavior

Use a positive worker count and decide the queue capacity separately. A large queue
increases memory and latency; it does not increase the number of executing workers.
CPU-heavy work and remote API calls often need different limits.

This protocol assumes the collector drains every result and the fixed producer finishes.
For request-scoped work, add a context cancellation case around producer sends, worker
receives where needed, and result sends. Otherwise a collector that returns early can
leave workers blocked. If jobs fail, return a result struct carrying both data and error,
or use errgroup when the first error should cancel the whole operation.

Do not infer input order from completion order. Attach an index to each job and result
when the output must preserve input position. Sorting is appropriate here because only
the set of squared values matters, not the original association.

## Check your understanding

```quiz
type: "mcq"
question: "Who closes results when several workers send to it?"
options: ["Each worker independently", "A coordinator after all workers finish", "The first receiver"]
answer: 1
explain: "Closing must happen after the final possible send, exactly once."
```

```quiz
type: "mcq"
question: "Why not call wg.Wait before starting the result receive loop?"
options: ["Workers could block sending results and never reach Done", "WaitGroups require sorted results", "It would start extra workers"]
answer: 0
explain: "Unbuffered sends need a receiver while work is still running."
```

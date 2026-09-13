# errgroup

`golang.org/x/sync/errgroup` combines concurrent task completion with error propagation.
WithContext also cancels a derived context when a task returns an error. Use it when
several operations belong to one request and the first failure makes sibling work unnecessary.

It is an external Go module, not part of the standard library. Install it with `go get`
and commit the selected version in go.mod and go.sum.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
      "golang.org/x/sync/errgroup"
  )

  func main() {
      g, ctx := errgroup.WithContext(context.Background())
      g.SetLimit(2)
      values := make([]int, 3)
      for i := range values {
          i := i
          g.Go(func() error {
              select {
              case <-ctx.Done(): return ctx.Err()
              default:
              }
              values[i] = (i + 1) * 10
              return nil
          })
      }
      if err := g.Wait(); err != nil { panic(err) }
      fmt.Println(values)
  }

  // Output:
  // [10 20 30]
hotspots: [{"line": 11, "match": "g.SetLimit(2)", "title": "Bound active tasks", "note": "Go may block while the limit is reached. Set the limit before launching tasks."}, {"line": 20, "match": "values[i] =", "title": "Disjoint destinations", "note": "Each task writes a different element; nobody reslices or appends concurrently."}, {"line": 24, "match": "g.Wait()", "title": "Join and inspect failure", "note": "Wait returns the first non-nil task error, or nil after successful completion."}]
```

## Errors, limits, and result ownership

The example uses x/sync v0.16.0 in its verification module; projects should choose and
record a reviewed version compatible with their Go toolchain. The explicit `i := i`
keeps the per-task index clear and also works with older loop semantics.

WithContext cancels its derived context on the first task error or when Wait returns,
even on success. Do not reuse that derived context for a follow-up operation after Wait;
use the parent or derive a new child. Each task must still cooperate with cancellation.

Errgroup returns one error rather than accumulating every failure. It does not recover
panics. Do not change a group's concurrency limit while tasks are active, and be careful
when tasks recursively submit tasks to the same limited group: blocked submissions can
prevent active tasks from finishing. Shared maps or appended result slices still need
synchronization; the group only manages task lifetime.

## Check your understanding

```quiz
type: "mcq"
question: "Can the derived ctx be reused after g.Wait succeeds?"
options: ["Yes, success keeps it active", "No, Wait also cancels the derived context", "Only if no limit was set"]
answer: 1
explain: "Use the parent or a new context for subsequent operations."
```

```quiz
type: "mcq"
question: "Why is values[i] safe here without a result mutex?"
options: ["Errgroup locks every variable", "Tasks write distinct elements and main reads only after Wait", "Slices are always safe for concurrent writes"]
answer: 1
explain: "The ownership pattern is safe; concurrent append or writes to the same element would be different."
```

## Further reading

[errgroup API](https://pkg.go.dev/golang.org/x/sync/errgroup)

# 6.5 sync.Mutex & sync.WaitGroup

A mutex protects shared state by allowing one goroutine at a time into a critical
section. A WaitGroup waits for a set of tasks to finish. These solve different problems:
waiting for completion does not itself serialize simultaneous updates.

Protect the entire invariant, including reads that race with writes, and make task
registration happen before waiting can observe the group.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "sync"
  )

  func main() {
      var mu sync.Mutex
      var wg sync.WaitGroup
      count := 0
      for i := 0; i < 3; i++ {
          wg.Add(1)
          go func() {
              defer wg.Done()
              mu.Lock()
              count++
              mu.Unlock()
          }()
      }
      wg.Wait()
      fmt.Println(count)
  }

  // Output:
  // 3
hotspots: [{"line": 13, "match": "wg.Add(1)", "title": "Register before launching", "note": "Doing this inside the goroutine could race with Wait observing an empty group."}, {"line": 15, "match": "defer wg.Done()", "title": "Report completion on return", "note": "Every registered task must call Done exactly once."}, {"line": 16, "match": "mu.Lock()", "title": "Protect the update", "note": "count++ is a read-modify-write sequence and needs mutual exclusion."}]
```

## Lock scope and lifecycle

The zero values of Mutex and WaitGroup are ready to use. Do not copy either after use;
pass pointers or put them in a type used through a pointer. A mutex is not reentrant:
attempting to lock it again in the same goroutine without unlocking blocks.

`defer mu.Unlock()` keeps unlock paired with a lock across return paths. Keep the
critical section small, and avoid network calls or unknown callbacks while holding a
lock. For read-heavy workloads, RWMutex permits multiple readers, but measure before
adding complexity and never mutate under a read lock.

Go 1.25 added `wg.Go(func() { ... })` to register and run a task together. Its function
must not panic. The explicit Add/go/Done form above also works on older versions and
makes the lifecycle visible. WaitGroup does not propagate errors or cancel siblings;
use an error channel or errgroup for those requirements.

## Check your understanding

```quiz
type: "mcq"
question: "Does a WaitGroup make concurrent count++ operations safe without a mutex?"
options: ["Yes, Wait protects every variable", "No, it only coordinates completion", "Only for fewer than four goroutines"]
answer: 1
explain: "Tasks may still run their increments simultaneously. Protect the shared counter separately."
```

```quiz
type: "mcq"
question: "Why call Add before starting the goroutine?"
options: ["To guarantee source-order execution", "To register work before Wait can return", "To allocate a mutex"]
answer: 1
explain: "Registration inside the goroutine can happen too late, after Wait has observed a zero counter."
```

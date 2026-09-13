# Mutex vs channel

Use a mutex when several goroutines need short, synchronized access to shared state.
Use a channel when transferring work, values, or ownership is the clearer model.
Neither tool is automatically more idiomatic for every concurrent problem.

A stock counter with a check-and-update invariant is naturally expressed as one critical
section. Protecting only the individual reads and writes would not protect the decision.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "sync"
  )

  type Stock struct {
      mu sync.Mutex
      remaining int
  }
  func (s *Stock) Take(n int) bool {
      if n <= 0 { return false }
      s.mu.Lock()
      defer s.mu.Unlock()
      if s.remaining < n { return false }
      s.remaining -= n
      return true
  }

  func main() {
      s := &Stock{remaining: 2}
      fmt.Println(s.Take(2))
      fmt.Println(s.Take(1))
  }

  // Output:
  // true
  // false
hotspots: [{"line": 14, "match": "s.mu.Lock()", "title": "One invariant boundary", "note": "Checking availability and decrementing happen under the same lock."}, {"line": 15, "match": "defer s.mu.Unlock()", "title": "All return paths release", "note": "The failed availability branch also unlocks."}, {"line": 17, "match": "s.remaining -= n", "title": "Mutation after the check", "note": "Another Take call cannot slip between the check and this update."}]
```

## Compare ownership models

An alternative is a single owner goroutine that receives reservation commands on a
channel and sends replies. This can work well when operations form a workflow, but it
needs queue bounds, cancellation, reply delivery, and shutdown rules. For one integer
invariant, a mutex is often easier to reason about.

Do not hold a lock while performing slow I/O or calling a callback with unknown locking
behavior. Snapshot necessary data under the lock, then work outside it when the invariant
allows that. A lock protects only participants that follow the same locking protocol.

A channel transfers its element value, not necessarily its data ownership. Sending a
pointer while retaining and mutating it on the sender side can still race. Document
whether the sender gives up access or whether both sides use synchronization. Run the
race detector on realistic exercised paths whichever model you choose.

## Check your understanding

```quiz
type: "mcq"
question: "What must be atomic in Stock.Take?"
options: ["Only decrementing remaining", "The availability check and decrement together", "Only the input validation"]
answer: 1
explain: "Separate locks around the read and write would allow another reservation between them."
```

```quiz
type: "mcq"
question: "Does sending *Stock through a channel prevent later shared-memory races?"
options: ["Yes, channels deep-copy structs", "No, it transfers a pointer value", "Only if the channel is unbuffered"]
answer: 1
explain: "Both goroutines can still refer to the same Stock. Ownership or synchronization must be explicit."
```

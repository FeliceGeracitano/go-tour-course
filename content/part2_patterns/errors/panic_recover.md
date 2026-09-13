# panic / recover boundaries

Return errors for expected failures such as invalid input or unavailable services.
A panic interrupts normal control flow and unwinds deferred calls. Recovery belongs at
a deliberate boundary where the program can decide what state is still safe to use.

A deferred function can call recover to inspect a panic in the same goroutine. Recover
does not resume execution at the failing statement.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func run(work func()) (err error) {
      defer func() {
          if p := recover(); p != nil { err = fmt.Errorf("work panicked: %v", p) }
      }()
      work()
      return nil
  }

  func main() {
      err := run(func() { panic("broken invariant") })
      fmt.Println(err)
      fmt.Println("caller continues")
  }

  // Output:
  // work panicked: broken invariant
  // caller continues
hotspots: [{"line": 7, "match": "(err error)", "title": "Named return value", "note": "The deferred function can set the error returned by run."}, {"line": 9, "match": "if p := recover();", "title": "Recover directly in a deferred function", "note": "This is the boundary that handles a panic while run unwinds."}, {"line": 11, "match": "work()", "title": "Potentially panicking work", "note": "Execution does not continue after this call inside run if it panics."}]
```

## Boundaries are not blanket suppression

A handler boundary may log an unexpected panic and terminate the request. Do not return
success merely because a panic was recovered, and do not assume shared state is still
consistent. Some runtime failures are fatal rather than ordinary recoverable panics.

Recovery applies only to the panicking goroutine. If work launches another goroutine,
that goroutine needs its own boundary when recovery is appropriate. A parent function's
defer cannot catch a child goroutine's panic. Deferred cleanup in the panicking goroutine
still runs as its stack unwinds.

For HTTP, net/http already contains a panic boundary around handler execution; it does
not guarantee a friendly JSON error response. A custom recovery layer must consider
whether headers or body bytes have already been written. Log diagnostic information
internally, and avoid sending stack traces or sensitive panic values to clients.

## Check your understanding

```quiz
type: "mcq"
question: "Can a deferred recover in main catch a panic in another goroutine?"
options: ["Yes, main owns all goroutines", "No, recovery is goroutine-local", "Only if main is sleeping"]
answer: 1
explain: "Recover handles panic unwinding in the same goroutine."
```

```quiz
type: "mcq"
question: "After recovery, where does execution continue?"
options: ["At the statement after panic", "At the recovering function’s caller after that function returns", "At the start of the panicking function"]
answer: 1
explain: "Recovery stops unwinding at the boundary; it does not restart the interrupted body."
```

# 2.4 defer

`defer` schedules a function call for the moment the surrounding function returns.
It is a good fit for cleanup immediately after acquiring a resource: the release stays
next to the acquisition even if several return paths appear later.

Two moments matter: the function value and arguments are evaluated now; the call itself
runs later. Multiple deferred calls execute in reverse registration order.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      n := 1
      defer fmt.Println("first", n)
      n = 2
      defer fmt.Println("second", n)
      fmt.Println("body", n)
  }

  // Output:
  // body 2
  // second 2
  // first 1
hotspots: [{"line": 9, "match": "defer fmt.Println(\"first\", n)", "title": "Capture arguments now", "note": "This registers a call with n equal to 1, even though n changes later."}, {"line": 11, "match": "defer fmt.Println(\"second\", n)", "title": "Last registered, first executed", "note": "This call runs before the earlier deferred call."}, {"line": 12, "match": "fmt.Println(\"body\", n)", "title": "Normal execution", "note": "Ordinary statements finish before the deferred calls execute."}]
```

## Cleanup and closures

After `f, err := os.Open(path)`, check `err` before writing `defer f.Close()`. Deferring
before the check risks operating on a nil file. A defer belongs to the function, not
the loop iteration: opening thousands of files inside one loop can keep all of them
open until the function returns. Use a helper function to give each file its own lifetime.

A closure behaves differently from an argument snapshot. `defer func() { fmt.Println(n) }()`
reads `n` when the closure runs, so it sees the final value. A deferred closure can also
modify named return values after a return statement assigns them; reserve this for
clear cases such as merging a close error into the returned error.

Deferred cleanup runs during normal return and panic unwinding. It does not run after
`os.Exit`. For writes, decide how to report `Close` errors instead of automatically
ignoring them: a successful write call is not always the last possible failure.

## Check your understanding

```quiz
type: "predict"
code: |
  n := 1
  defer func() { fmt.Println(n) }()
  n = 3
options: ["1", "3", "Nothing"]
answer: 1
explain: "The closure reads the variable when the deferred function executes, after n becomes 3."
```

```quiz
type: "mcq"
question: "A defer inside a loop runs when…"
options: ["That iteration ends", "The surrounding function returns", "The next loop iteration begins"]
answer: 1
explain: "Defer is function-scoped. A helper function can give each iteration an independent cleanup boundary."
```

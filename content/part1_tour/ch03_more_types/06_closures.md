# 3.6 Function values & closures

Functions are values: they can be assigned, passed to other functions, or returned.
A closure is a function value that refers to variables from its surrounding scope.
Those variables remain available as long as the closure needs them.

Each call to a factory function can create independent state. Several closures created
within one call can instead share the same captured variable.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func counter() func() int {
      n := 0
      return func() int {
          n++
          return n
      }
  }

  func main() {
      a := counter()
      b := counter()
      fmt.Println(a(), a(), b())
  }

  // Output:
  // 1 2 1
hotspots: [{"line": 7, "match": "func counter() func() int", "title": "Return a function", "note": "counter takes no arguments and returns a function that takes none and returns an int."}, {"line": 8, "match": "n := 0", "title": "Captured state", "note": "This variable is created once per call to counter, not once per call to the returned function."}, {"line": 10, "match": "n++", "title": "Read and update shared captured storage", "note": "Calling a repeatedly updates its own captured n."}]
```

## Capture is not a snapshot

A closure captures variables, not a frozen copy of their current values. If surrounding
code later assigns to a captured variable, the closure observes that assignment.
To preserve a value for one invocation, pass it as an argument to the function instead.

Function types describe parameters and results, for example `func(int) bool`. Names of
parameters are not part of type identity. A nil function value cannot be called; doing
so panics. Function values can be compared with nil but not with each other.

Closures are useful for filters, callbacks, and small stateful adapters. Keep ownership
clear: a counter closure called from multiple goroutines has shared mutable state and
needs synchronization. For modern loop variables declared using `:=`, Go 1.22+ gives
each iteration its own variable; assigning to a pre-existing loop variable still reuses
that variable.

## Check your understanding

```quiz
type: "predict"
code: |
  x := 1
  f := func() int { return x }
  x = 9
  fmt.Println(f())
options: ["1", "9", "Compile error"]
answer: 1
explain: "The closure reads x when called. x was reassigned to 9."
```

```quiz
type: "mcq"
question: "What makes a() and b() independent in the example?"
options: ["All closures automatically copy their state on every call", "Each call to counter creates a distinct n", "Function values never share variables"]
answer: 1
explain: "Separate factory invocations create separate captured variables. Closures from the same invocation may share them."
```

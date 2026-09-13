# 4.1 Methods & receivers

A method is a function attached to a named type through a receiver. It lets callers
ask a value to perform an operation, such as advancing a counter or formatting a price.
Receivers can be values or pointers, and that choice affects both mutation and interfaces.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Counter int

  func (c *Counter) Increment() { *c++ }
  func (c Counter) Value() int { return int(c) }

  func main() {
      c := Counter(4)
      c.Increment()
      fmt.Println(c.Value())
  }

  // Output:
  // 5
hotspots: [{"line": 9, "match": "(c *Counter)", "title": "Pointer receiver", "note": "Increment can change the caller’s Counter through its pointer."}, {"line": 10, "match": "(c Counter)", "title": "Value receiver", "note": "Value receives a copy, which is sufficient for reading this integer."}, {"line": 14, "match": "c.Increment()", "title": "Convenient address-taking", "note": "Because c is addressable, Go can use &c for this call."}]
```

## Method sets matter

For a named type `T`, its method set contains methods with receiver `T`. The method set
of `*T` contains methods with receiver `T` or `*T`. This difference matters when assigning
a value to an interface: automatic address-taking at a call site does not make `T`
implement an interface that requires a pointer-receiver method.

Use pointer receivers when methods mutate the value or when copying would be expensive
or invalid. A struct containing a mutex must not be copied after use. Value receivers
are useful for small values with value semantics. Keep receiver choices consistent for
a type unless there is a clear reason to mix them; this example mixes them to expose
the distinction.

You may define methods on your own named non-struct types, as Counter demonstrates.
The receiver's base type must be defined in the same package. A method can be called
with a nil pointer receiver, but its implementation must handle nil before dereferencing
it if that behavior is part of its contract.

## Check your understanding

```quiz
type: "mcq"
question: "An interface requires Increment(). Which type implements it here?"
options: ["Counter only", "*Counter only", "Both Counter and *Counter"]
answer: 1
explain: "Increment has a pointer receiver, so it is in the method set of *Counter but not Counter."
```

```quiz
type: "mcq"
question: "A value-receiver method assigns to an integer field. What changes?"
options: ["The receiver copy", "Every instance of the type", "The caller’s original integer field"]
answer: 0
explain: "The receiver is passed by value. Fields containing pointers or slices can still refer to shared storage."
```

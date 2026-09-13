# 3.1 Pointers

A pointer holds the address of a value. `&x` takes the address of `x`; `*p` reads or
writes the value at pointer `p`. The type `*int` means “pointer to an int.”

Go passes arguments by value, including pointers. Copying a pointer still points to the
same value, which lets a function mutate the caller's storage deliberately.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      score := 10
      p := &score
      *p += 5
      fmt.Println(score, *p)
      var missing *int
      fmt.Println(missing == nil)
  }

  // Output:
  // 15 15
  // true
hotspots: [{"line": 9, "match": "p := &score", "title": "Take an address", "note": "p points at the existing score variable; it does not contain a separate integer copy."}, {"line": 10, "match": "*p += 5", "title": "Dereference for mutation", "note": "This changes score through its address."}, {"line": 12, "match": "var missing *int", "title": "Nil zero value", "note": "An uninitialised pointer is nil. Dereferencing it panics."}]
```

## Choose mutation deliberately

A function `func add(p *int) { *p += 1 }` changes the pointed-to integer. Reassigning `p`
itself inside that function changes only its local pointer copy. This distinction is
also important when methods use pointer receivers.

Go has no ordinary pointer arithmetic. You cannot advance `p` with `p++` to walk memory;
use slices and indexes. Returning the address of a local variable is valid: Go manages
the lifetime of values that remain reachable. You do not manually free them, and taking
an address does not itself promise a particular stack or heap placement.

Use a pointer when shared identity, mutation, or a meaningful nil state is needed.
Small immutable values often work better as plain values. A pointer does not make
concurrent access safe: two goroutines mutating the same integer still need coordination.

## Check your understanding

```quiz
type: "predict"
code: |
  x := 3
  p := &x
  q := p
  *q = 8
  fmt.Println(x, *p)
options: ["3 8", "8 8", "3 3"]
answer: 1
explain: "p and q contain copies of the same address, so both refer to x."
```

```quiz
type: "mcq"
question: "What happens when a nil *int is dereferenced?"
options: ["It reads zero", "It allocates an int", "It panics"]
answer: 2
explain: "Nil represents no pointed-to value. Check it or establish a non-nil invariant before dereferencing."
```

# 5.2 Generic types

A generic type carries its type parameters into its fields and methods. It lets a
container retain element types instead of returning `any` and asking callers to assert
them later.

This stack uses a slice internally. Its zero value is empty and usable, and Pop reports
whether a value was available.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Stack[T any] struct { values []T }
  func (s *Stack[T]) Push(v T) { s.values = append(s.values, v) }
  func (s *Stack[T]) Pop() (T, bool) {
      var zero T
      n := len(s.values)
      if n == 0 { return zero, false }
      v := s.values[n-1]
      s.values[n-1] = zero
      s.values = s.values[:n-1]
      return v, true
  }

  func main() {
      var s Stack[string]
      s.Push("first")
      s.Push("last")
      v, ok := s.Pop()
      fmt.Println(v, ok)
  }

  // Output:
  // last true
hotspots: [{"line": 7, "match": "Stack[T any]", "title": "Type parameter belongs to the type", "note": "The values field is []T for whichever T the caller supplies."}, {"line": 10, "match": "var zero T", "title": "A zero value of any T", "note": "No assumption is needed about whether T is numeric, a pointer, or another type."}, {"line": 14, "match": "s.values[n-1] = zero", "title": "Release references", "note": "Clear the removed slot before shortening the slice so backing storage does not retain an unwanted reference."}]
```

## Instantiate the container

Write `Stack[string]`, `Stack[int]`, or another explicit type argument when naming the
type. These instantiations are distinct types: a Stack[int] is not a Stack[int64].
Methods redeclare the receiver's type parameter names as in `*Stack[T]`; the constraints
come from the type declaration.

Before Go 1.27, methods could not introduce their own additional type parameter list. If
an operation needs a new independent type, such as mapping a Stack[A] to a Stack[B], the
portable form is a generic function with both parameters. Go 1.27 adds generic methods
with their own type parameters; modules declaring an older language version still reject
them.

Container design still needs ordinary ownership rules. Copying this Stack copies its
slice header, so populated copies may share backing storage. Use it through one owner
or define an explicit clone operation. The stack also does not synchronize concurrent
Push and Pop operations; add a lock or keep it within one goroutine if shared mutation
is needed.

## Check your understanding

```quiz
type: "mcq"
question: "Why return (T, bool) from Pop?"
options: ["To distinguish an empty stack from a stored zero value", "Because generic functions cannot return errors", "To sort the values"]
answer: 0
explain: "A stored empty string or zero integer is still a valid stack element; the boolean distinguishes absence."
```

```quiz
type: "mcq"
question: "Does copying a populated Stack create an independent backing array?"
options: ["Always", "No, its slice header is copied", "Only for string elements"]
answer: 1
explain: "Generics do not change ordinary slice copying and aliasing rules."
```

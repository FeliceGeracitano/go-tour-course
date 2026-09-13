# 5.1 Type parameters & constraints

A generic function names one or more type parameters in square brackets. A constraint
specifies which type arguments are allowed and which operations the function may use.
Generics are useful when an algorithm stays the same across several concrete types.

Start with an index search. It needs equality, so its element type must support `==`.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func Index[T comparable](values []T, target T) int {
      for i, value := range values {
          if value == target { return i }
      }
      return -1
  }

  func main() {
      fmt.Println(Index([]string{"tea", "coffee"}, "coffee"))
      fmt.Println(Index([]int{4, 8}, 3))
  }

  // Output:
  // 1
  // -1
hotspots: [{"line": 7, "match": "[T comparable]", "title": "Declare a type parameter", "note": "T is available throughout the signature and function body. comparable permits equality."}, {"line": 7, "match": "values []T, target T", "title": "One consistent type", "note": "The slice elements and target must use the same T for this call."}, {"line": 15, "match": "Index([]string", "title": "Type inference", "note": "Go infers T as string from the arguments; Index[string](...) is also valid."}]
```

## Constraints describe available operations

`any` permits values of any type but does not permit arbitrary operations on them. A
function using only `any` cannot assume `+`, ordering, or equality will work. Choose the
smallest constraint that describes the algorithm's actual needs.

Type inference often removes explicit type arguments from function calls, but not every
type parameter can be inferred from every call. Supply arguments such as `Index[int]`
when necessary. A generic function is instantiated with concrete type arguments before
it is used as a function value.

Do not replace ordinary interfaces automatically with generics. Use an interface when
callers provide different implementations of behavior, such as io.Reader. Use type
parameters when preserving a relationship between types matters, such as returning an
element of the same type as the input slice. Non-generic code is still appropriate when
there is only one useful concrete type.

## Check your understanding

```quiz
type: "mcq"
question: "Why does Index require comparable rather than any?"
options: ["It calls == on two values of T", "It creates a slice", "It returns an int"]
answer: 0
explain: "Equality must be valid for the admitted type arguments."
```

```quiz
type: "mcq"
question: "Can Index([][]int{{1}}, []int{1}) use this constraint?"
options: ["Yes, slices are comparable by contents", "No, []int does not satisfy comparable", "Only if both slices have length one"]
answer: 1
explain: "Slices cannot be compared with ==, so []int cannot be used as T here."
```

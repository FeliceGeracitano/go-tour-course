# 3.3 Arrays

An array has a fixed number of elements of one type. Its length is part of its type:
`[3]int` and `[4]int` are different types. Every element starts with its type's zero value.

Arrays are values. Assigning or passing an array copies its elements, which is useful
when a fixed-size value should be independent. Slices are the usual choice for a
collection whose length changes.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      a := [3]int{2, 4, 6}
      b := a
      b[0] = 9
      fmt.Println(a, b)
      for i, value := range a {
          fmt.Println(i, value)
      }
  }

  // Output:
  // [2 4 6] [9 4 6]
  // 0 2
  // 1 4
  // 2 6
hotspots: [{"line": 8, "match": "[3]int", "title": "Length is part of the type", "note": "This value has exactly three integer elements."}, {"line": 9, "match": "b := a", "title": "Copy all elements", "note": "b has its own storage; writing b[0] leaves a unchanged."}, {"line": 12, "match": "range a", "title": "Index and copied value", "note": "Indexes start at zero. value is a copy of the current element."}]
```

## Bounds and literals

`[...]int{2, 4, 6}` asks the compiler to count literal elements. It still creates a fixed
array, not a growable container. `len(a)` reports the fixed length, and valid indexes
run from zero through `len(a)-1`. A constant out-of-range index is rejected at compile
time; an out-of-range runtime index panics.

You cannot append directly to an array. `a[:]` produces a slice covering the array and
sharing its storage. Changes through that slice affect the array. Passing `*[3]int`
can avoid a copy when shared mutation is intentional, but a slice parameter is often a
more flexible interface.

Arrays of comparable elements are comparable themselves. This makes a fixed byte array
useful as a map key, for example a digest. An array containing slices cannot be compared,
because its elements are not comparable.

## Check your understanding

```quiz
type: "predict"
code: |
  a := [2]int{7}
  b := a
  b[1] = 3
  fmt.Println(a, b)
options: ["[7 0] [7 3]", "[7 3] [7 3]", "[7] [7 3]"]
answer: 0
explain: "The second element starts at zero. Array assignment copies both elements."
```

```quiz
type: "mcq"
question: "Can a [3]int be passed to a parameter of type [4]int?"
options: ["Yes, with a trailing zero", "No, the lengths are part of different types", "Only if its last element is zero"]
answer: 1
explain: "Array types must match. Use a slice parameter when several lengths should be accepted."
```

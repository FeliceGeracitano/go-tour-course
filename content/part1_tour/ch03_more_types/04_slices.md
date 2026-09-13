# 3.4 Slices

A slice describes a window onto a backing array. Its value contains a reference to the
storage, a length, and a capacity. Length counts accessible elements; capacity counts
how far the window can grow from its starting position before new storage is needed.

Copying or reslicing a slice can share storage. This is efficient, but it means a change
through one slice may be visible through another.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      s := []int{10, 20, 30}
      t := s[:2]
      t = append(t, 99)
      fmt.Println(s, t)
      u := append([]int(nil), s...)
      u[0] = 7
      fmt.Println(s[0], u[0])
  }

  // Output:
  // [10 20 99] [10 20 99]
  // 10 7
hotspots: [{"line": 9, "match": "s[:2]", "title": "Half-open window", "note": "Includes indexes 0 and 1. The capacity is still 3."}, {"line": 10, "match": "append(t, 99)", "title": "Growth within capacity", "note": "The appended element uses the shared array slot at index 2."}, {"line": 12, "match": "append([]int(nil), s...)", "title": "Independent copy", "note": "Starting from nil forces separate storage for this nonempty copy."}]
```

## Length, capacity, and allocation

`make([]int, 2, 5)` gives two zero-valued elements with room for five. Indexing element 2
still panics until the length is extended. `append` returns a slice, so keep its result:
`s = append(s, value)`. It may reuse the array or allocate a different one. Do not rely
on a specific capacity growth factor; that is an implementation decision.

A full slice expression such as `s[:2:2]` restricts capacity as well as length. Appending
beyond that capacity uses different storage, but modifying an existing element still
modifies the shared array. For explicit copying, use `slices.Clone` or `make` plus `copy`.

A nil slice has length and capacity zero and can be appended to. A non-nil empty slice
also has length zero, but can differ in serialization. Slices cannot be compared with
`==` except against nil; compare elements with `slices.Equal` when appropriate.
A tiny subslice can keep a large array reachable, so copy if that lifetime is unwanted.

```diagram
id: "slices-backing-array"
```

## Check your understanding

```quiz
type: "predict"
code: |
  a := []int{1, 2, 3}
  b := a[:1:1]
  b = append(b, 8)
  b[0] = 9
  fmt.Println(a[0], b[0])
options: ["9 9", "1 9", "1 1"]
answer: 1
explain: "b has capacity 1. Appending allocates separate storage before b[0] is changed."
```

```quiz
type: "mcq"
question: "For make([]int, 2, 5), which index can be read immediately?"
options: ["4", "2", "1"]
answer: 2
explain: "Length controls indexing; capacity only describes potential growth."
```

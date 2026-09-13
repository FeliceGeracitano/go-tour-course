# 3.2 Structs

A struct groups named fields into a value. It works well for domain data such as a
product, coordinate, or request. Use a named type so function signatures describe the
thing being passed instead of repeating its shape.

Struct assignment copies the struct. Fields that contain references, such as slices,
maps, and pointers, can still refer to shared data after that copy.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Product struct {
      Name string
      Stock int
  }

  func main() {
      original := Product{Name: "Notebook", Stock: 3}
      copy := original
      copy.Stock--
      p := &original
      p.Stock += 2
      fmt.Println(original.Stock, copy.Stock)
  }

  // Output:
  // 5 2
hotspots: [{"line": 13, "match": "Product{Name:", "title": "Keyed literal", "note": "Name the fields you are setting. Omitted fields get their zero values."}, {"line": 14, "match": "copy := original", "title": "Value copy", "note": "Changing copy.Stock does not change original.Stock."}, {"line": 17, "match": "p.Stock += 2", "title": "Automatic dereference", "note": "For a pointer to a struct, p.Stock is shorthand for (*p).Stock."}]
```

## Fields and ownership

A field beginning with an uppercase letter is exported to other packages. Lowercase
fields can keep an invariant private, with methods providing a controlled way to change
it. Tags such as `json:"name"` are metadata used by libraries; they do not change normal
field access or enforce validation by themselves.

Prefer keyed literals for data with several fields. Positional literals tie callers to
field order, and code outside a package cannot initialise its unexported fields directly.
`var p Product` gives an empty name and zero stock without a constructor.

Struct equality works only if all its fields are comparable. A struct containing a slice
cannot be compared using `==`. When a struct contains a slice, copying the struct copies
the slice header, not the backing array. Decide whether callers should share that storage
or whether your API should clone it.

## Check your understanding

```quiz
type: "predict"
code: |
  type Point struct { X, Y int }
  a := Point{X: 4}
  b := a
  b.Y = 9
  fmt.Println(a.Y, b.Y)
options: ["0 9", "9 9", "Compile error"]
answer: 0
explain: "The omitted Y field starts at zero, and b is an independent struct value."
```

```quiz
type: "mcq"
question: "Copying a struct that contains a []byte field also copies…"
options: ["Every byte in the backing array", "The slice header, which still refers to the same backing array", "Nothing; structs cannot contain slices"]
answer: 1
explain: "Structs copy field values. A slice value describes shared backing storage."
```

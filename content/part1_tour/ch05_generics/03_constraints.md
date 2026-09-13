# 5.3 comparable, ~, constraint interfaces

Constraints are interfaces used to describe permitted type sets. `comparable` enables
equality and map keys; a union such as `int | int64` admits the listed types. A tilde
includes named types with the specified underlying type.

Use these rules to accept meaningful domain types without giving up the operations
an algorithm needs.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Integer interface { ~int | ~int64 }
  func Sum[T Integer](values []T) T {
      var total T
      for _, v := range values { total += v }
      return total
  }

  func main() {
      type Cents int64
      fmt.Println(Sum([]Cents{120, 80}))
  }

  // Output:
  // 200
hotspots: [{"line": 7, "match": "~int | ~int64", "title": "Union of underlying types", "note": "Accepts int and int64, plus named types whose underlying types are int or int64."}, {"line": 10, "match": "total += v", "title": "Operation supported by the type set", "note": "Every admitted type supports addition."}, {"line": 15, "match": "type Cents int64", "title": "Named domain type", "note": "Cents is distinct from int64, but satisfies the ~int64 term."}]
```

## Type sets and ordinary values

Without the tilde, `int64` admits that exact type, not a newly defined `type Cents int64`.
An alias is different from a new defined type. Avoid broad numeric constraints when the
algorithm needs a narrower operation such as bit shifting.

An interface containing type terms is a constraint-only interface, not an ordinary
runtime value type. You can write `Sum[T Integer]`; you cannot declare a normal variable
of type Integer and store mixed numeric values in it.

`comparable` is useful for maps and equality, but it does not promise ordering. There is
also a subtle interface case: `any` can satisfy a comparable constraint in modern Go,
yet comparing interface values can panic if their dynamic values are slices or maps.
A generic set with interface keys therefore still needs a contract about admissible
runtime values. Prefer concrete comparable key types when possible.

## Check your understanding

```quiz
type: "mcq"
question: "Why does Cents satisfy Integer?"
options: ["All named types satisfy all interfaces", "Its underlying type is int64 and the constraint uses ~int64", "Cents is automatically converted to int"]
answer: 1
explain: "The tilde includes defined types with the specified underlying type."
```

```quiz
type: "mcq"
question: "Does comparable guarantee that values can be ordered with <?"
options: ["Yes", "No; equality does not imply ordering", "Only for interface values"]
answer: 1
explain: "For example, comparable includes booleans and suitable structs, which have equality but no ordering operators."
```

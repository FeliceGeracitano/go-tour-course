# 3.5 Maps

A map associates unique keys with values. `map[string]int` is useful for counters,
stock levels, or lookup tables. Keys must be comparable; slices, maps, and functions
cannot be ordinary map keys.

A missing key returns the value type's zero value. Use the two-result lookup when zero
could also be a value that was explicitly stored.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      stock := map[string]int{"tea": 0, "coffee": 5}
      quantity, exists := stock["tea"]
      fmt.Println(quantity, exists)
      quantity, exists = stock["water"]
      fmt.Println(quantity, exists)
      stock["water"] = 8
      delete(stock, "coffee")
      fmt.Println(len(stock))
  }

  // Output:
  // 0 true
  // 0 false
  // 2
hotspots: [{"line": 9, "match": "quantity, exists :=", "title": "Comma-ok lookup", "note": "exists distinguishes a present zero from a missing key."}, {"line": 13, "match": "stock[\"water\"] = 8", "title": "Insert or replace", "note": "Assignment creates a key if absent, or replaces its value if present."}, {"line": 14, "match": "delete(stock, \"coffee\")", "title": "Remove a key", "note": "Deleting a missing key is also safe."}]
```

## Initialisation, iteration, and sharing

The zero value of a map is nil. Reading, taking its length, and deleting from it are
safe; assigning an entry panics. Initialise with `make(map[string]int)` or a map literal
before writing. Assigning a map to another variable shares its underlying data rather
than copying all entries.

`for key, value := range m` visits entries in an unspecified order. If output must be
stable, collect and sort the keys first. Do not build a test that assumes map iteration
will return the same order twice.

A map value is not directly addressable. For a map of structs, read the struct, update
it, and assign it back, or store pointers if shared identity is intended. Concurrent
reads are fine when nobody writes; concurrent access involving writes needs a mutex or
another coordination strategy. The map itself does not provide that synchronization.

## Check your understanding

```quiz
type: "predict"
code: |
  m := map[string]int{"x": 0}
  _, a := m["x"]
  _, b := m["y"]
  fmt.Println(a, b)
options: ["true false", "false false", "true true"]
answer: 0
explain: "The existence result describes key presence, independently of the stored value."
```

```quiz
type: "mcq"
question: "Which operation on a nil map panics?"
options: ["Reading a missing key", "Deleting a key", "Assigning a key"]
answer: 2
explain: "Nil maps can be read, but must be allocated before entries are written."
```

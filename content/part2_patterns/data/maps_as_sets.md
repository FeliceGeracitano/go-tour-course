# Maps as sets

A `map[T]struct{}` represents a set of comparable keys. Membership is the map's lookup-ok
result, and the empty struct makes it clear that only keys carry information.

Use this for deduplication, allowlists, or tracking which IDs have already been visited.
Preserve order separately if the caller needs a stable sequence.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      seen := make(map[string]struct{})
      unique := []string{}
      for _, id := range []string{"b", "a", "b"} {
          if _, exists := seen[id]; exists { continue }
          seen[id] = struct{}{}
          unique = append(unique, id)
      }
      fmt.Println(unique)
      _, exists := seen["a"]
      fmt.Println(exists)
  }

  // Output:
  // [b a]
  // true
hotspots: [{"line": 8, "match": "map[string]struct{}", "title": "Keys are the data", "note": "An empty struct expresses that no associated payload is needed."}, {"line": 11, "match": "if _, exists := seen[id]", "title": "Membership test", "note": "Use presence, not the zero value of the empty struct."}, {"line": 13, "match": "unique = append(unique, id)", "title": "Preserve first-seen order", "note": "The slice records order; iterating the map would not."}]
```

## Set operations and tradeoffs

Insert with `set[key] = struct{}{}` and remove with `delete(set, key)`. Membership is
`_, ok := set[key]`; `len(set)` counts distinct keys. A nil set can be read but must be
allocated before insertion, just like any other map.

For an intersection, iterate one set and keep keys present in the other. For a union,
copy keys from both. These operations still need an ordering policy if returning a
slice. Sort the result or preserve input order explicitly rather than relying on map
iteration.

`map[T]bool` can also represent membership, but then decide whether a false value means
absent or is still a stored member. An empty-struct set avoids that ambiguity. Comparable
keys include suitable structs and arrays, but not slices. Concurrent mutation still
requires synchronization; being a set does not change the map's rules.

## Check your understanding

```quiz
type: "predict"
code: |
  s := map[string]struct{}{}
  s["x"] = struct{}{}
  s["x"] = struct{}{}
  fmt.Println(len(s))
options: ["1", "2", "0"]
answer: 0
explain: "Map keys are unique; inserting the same key again replaces its value."
```

```quiz
type: "mcq"
question: "How does the example preserve input order?"
options: ["Go maps remember insertion order", "It records first-seen keys in a separate slice", "The empty struct sorts keys"]
answer: 1
explain: "Map iteration is unspecified; the slice supplies the ordering contract."
```

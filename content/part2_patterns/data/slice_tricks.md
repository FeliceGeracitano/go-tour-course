# Slice tricks: filter in place, delete, copy

Filtering or deleting in place saves allocations when you own a slice's backing
storage. The same technique is dangerous when other callers expect that storage to
remain unchanged. Decide ownership before choosing the shorter operation.

An in-place filter reuses the front of the slice for accepted values, then clears
removed slots that might otherwise keep references alive.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "slices"
  )

  func main() {
      values := []int{1, 2, 3, 4}
      kept := values[:0]
      for _, v := range values {
          if v%2 == 0 { kept = append(kept, v) }
      }
      clear(values[len(kept):])
      fmt.Println(kept)
      independent := slices.Clone(kept)
      kept = slices.Delete(kept, 0, 1)
      fmt.Println(kept, independent)
  }

  // Output:
  // [2 4]
  // [4] [2 4]
hotspots: [{"line": 10, "match": "values[:0]", "title": "Reuse owned storage", "note": "The slice has length zero but retains the original capacity."}, {"line": 14, "match": "clear(values[len(kept):])", "title": "Clear the unused tail", "note": "For pointers or strings this prevents stale references from retaining other objects."}, {"line": 16, "match": "slices.Clone(kept)", "title": "Separate storage", "note": "The clone’s elements are shallow copies; nested references may still share data."}]
```

## Pick the right operation

`copy(dst, src)` copies up to the smaller length and supports overlapping slices.
Allocate the destination first when you need a full independent copy. `append(dst,
src...)` extends a destination but can reuse its array, so it is not automatically a
clone of either input.

`slices.Delete(s, i, j)` removes the half-open range and returns the shortened slice.
Keep that result. It shifts later elements and, in modern Go, clears the obsolete tail.
Repeated deletion near the beginning is linear work each time; one filtering pass is
often a better choice.

The example preserves the order of accepted values. If order does not matter, replacing
a removed element with the last element is another design, but document the changed
ordering. None of these operations synchronize with concurrent readers or writers.

## Check your understanding

```quiz
type: "mcq"
question: "Why must callers keep the result of slices.Delete?"
options: ["It returns the updated slice length/header", "The input is a map", "The result is an error"]
answer: 0
explain: "The backing array may be mutated, but the returned slice describes the shortened logical sequence."
```

```quiz
type: "mcq"
question: "Does slices.Clone deeply copy values pointed to by []*Item?"
options: ["Yes", "No, it copies the pointers into a separate slice", "It refuses pointer elements"]
answer: 1
explain: "The backing array is independent, but pointed-to objects remain shared."
```

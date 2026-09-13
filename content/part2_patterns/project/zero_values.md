# Constructors & useful zero values

A useful zero value lets callers declare a type and use it immediately. Go's Mutex,
bytes.Buffer, and several other types follow this pattern. Constructors remain valuable
when required dependencies or invariants cannot be represented by a usable zero value.

A map-backed registry can lazily allocate its map on the first write while allowing
reads from an empty zero value.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "sync"
  )

  type Registry struct {
      mu sync.Mutex
      counts map[string]int
  }
  func (r *Registry) Set(key string, n int) {
      r.mu.Lock()
      defer r.mu.Unlock()
      if r.counts == nil { r.counts = make(map[string]int) }
      r.counts[key] = n
  }
  func (r *Registry) Get(key string) int {
      r.mu.Lock()
      defer r.mu.Unlock()
      return r.counts[key]
  }

  func main() {
      var r Registry
      fmt.Println(r.Get("tea"))
      r.Set("tea", 3)
      fmt.Println(r.Get("tea"))
  }

  // Output:
  // 0
  // 3
hotspots: [{"line": 25, "match": "var r Registry", "title": "Ready without a constructor", "note": "The mutex works at zero, and Get can safely read a nil map."}, {"line": 15, "match": "if r.counts == nil", "title": "Lazy allocation", "note": "Set allocates storage while holding the same lock that protects writes."}, {"line": 21, "match": "return r.counts[key]", "title": "Missing-key contract", "note": "This API deliberately treats missing and stored zero identically."}]
```

## Zero value is not nil receiver

A zero Registry is a real value; a nil *Registry is not. These methods dereference their
receiver and do not promise nil-pointer behavior. Document that distinction rather than
adding nil checks to every method without a use case.

Registry contains a mutex and must not be copied after use. Keep it behind a pointer
when passing it between components. A constructor may still be useful to supply an
initial capacity or optional defaults, but ordinary use does not require one.

A database-backed service with mandatory credentials may need a constructor that checks
dependencies and returns an error. Do not force every type to have a useful zero value
if that would create invalid partially initialized states. Conversely, avoid constructors
whose only purpose is to repeat what Go's zero values already provide.

## Check your understanding

```quiz
type: "mcq"
question: "Why can Get work before the map is allocated?"
options: ["Reading a nil map returns the value type’s zero value", "The mutex automatically allocates maps", "Get never reads counts"]
answer: 0
explain: "Nil map reads are safe; writes require allocation."
```

```quiz
type: "mcq"
question: "Is a zero Registry equivalent to a nil *Registry?"
options: ["Yes", "No, the zero struct exists while the nil pointer points nowhere", "Only when its map is empty"]
answer: 1
explain: "Useful-zero-value support does not imply nil-receiver support."
```

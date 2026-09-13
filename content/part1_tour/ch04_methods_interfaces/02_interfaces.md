# 4.2 Interfaces

An interface describes behavior as a set of methods. A concrete type satisfies it
implicitly by having those methods with matching signatures. There is no implements
keyword and no registration step.

Use interfaces at boundaries where callers need behavior rather than a particular
implementation. An interface value carries both a dynamic type and a dynamic value.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Labeler interface { Label() string }
  type Item struct { Name string }
  func (i Item) Label() string { return i.Name }

  func main() {
      var label Labeler = Item{Name: "tea"}
      fmt.Println(label.Label())
      var absent *Item
      label = absent
      fmt.Println(label == nil)
  }

  // Output:
  // tea
  // false
hotspots: [{"line": 7, "match": "interface { Label() string }", "title": "Behavior contract", "note": "Any suitable type with Label() string can be assigned here."}, {"line": 13, "match": "label.Label()", "title": "Dynamic dispatch", "note": "The concrete value supplies the method implementation."}, {"line": 15, "match": "label = absent", "title": "Typed nil", "note": "The interface now contains dynamic type *Item and a nil pointer value, so the interface itself is not nil."}]
```

## Nil and useful boundaries

A nil interface has neither a dynamic type nor a dynamic value. An interface holding a
nil pointer still has a type and therefore compares unequal to nil. Calling a method on
that value may panic; the example deliberately only compares it. Return a plain `nil`
from an error-returning function when there is no failure, rather than returning a typed
nil error pointer.

`any` is an alias for the empty interface. It accepts any value but promises no methods.
You need a type assertion or type switch to recover a more specific capability. Prefer
a meaningful small interface to `any` when the behavior is known.

Define an interface near the code that consumes it. A report writer may need only
`Write([]byte) (int, error)`, not every method of a concrete file. Such small contracts
also make test doubles easy to write. Avoid creating an interface merely because every
struct is expected to have one.

## Check your understanding

```quiz
type: "predict"
code: |
  var x any
  fmt.Println(x == nil)
  var p *int
  x = p
  fmt.Println(x == nil)
options: ["true then true", "true then false", "false then false"]
answer: 1
explain: "The first interface is empty. The second holds a *int dynamic type, even though its pointer value is nil."
```

```quiz
type: "mcq"
question: "How does a type declare that it implements an interface?"
options: ["By defining the required methods", "By embedding the interface name in every instance", "By registering itself at startup"]
answer: 0
explain: "Satisfaction is implicit and checked by the compiler at assignments and other uses."
```

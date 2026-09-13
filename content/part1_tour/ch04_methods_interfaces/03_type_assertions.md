# 4.3 Type assertions & type switches

A type assertion inspects the concrete value stored in an interface. `x.(string)` asks
for a string; it does not convert numbers to text. Use the comma-ok form when a mismatch
is an expected possibility.

A type switch handles several dynamic types without repeatedly asserting them.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      var value any = 42
      text, ok := value.(string)
      fmt.Println(text == "", ok)
      switch v := value.(type) {
      case int:
          fmt.Println(v + 1)
      case string:
          fmt.Println(len(v))
      default:
          fmt.Println("unsupported")
      }
  }

  // Output:
  // true false
  // 43
hotspots: [{"line": 9, "match": "value.(string)", "title": "Safe assertion with ok", "note": "On mismatch, text gets the string zero value and ok is false."}, {"line": 11, "match": "value.(type)", "title": "Type switch only", "note": "This special syntax is legal in the guard of a type switch."}, {"line": 12, "match": "case int:", "title": "Narrowed type", "note": "Inside this single-type case, v is an int and supports integer operations."}]
```

## Assertions, conversions, and nil

The single-result form `s := value.(string)` panics if the assertion fails. The two-result
form `s, ok := value.(string)` lets you branch safely. Assertions can also target an
interface, such as `io.Reader`, to ask whether the dynamic type supports that behavior.

A conversion like `int64(n)` transforms a value according to conversion rules. An
assertion does not do that: an interface containing an `int` does not satisfy `.(int64)`.
Likewise, a named string type is distinct from the built-in `string` type.

In a type switch, `case nil` matches an empty interface. A typed nil pointer matches
its pointer type case. For a case listing multiple types, the switch variable retains
the original interface type because there is no single concrete type to give it.
Consider whether a method on a small interface would replace a growing type switch more
cleanly; a switch is best when classification itself is the intended operation.

## Check your understanding

```quiz
type: "mcq"
question: "An any contains int(7). What does x.(int64) do in single-result form?"
options: ["Converts 7 to int64", "Panics", "Returns zero"]
answer: 1
explain: "Assertions inspect the actual dynamic type. int and int64 are distinct."
```

```quiz
type: "mcq"
question: "Which form handles a possible mismatch without panic?"
options: ["v, ok := x.(string)", "v := string(x)", "v := x.(string)"]
answer: 0
explain: "The comma-ok form reports success explicitly and returns a zero value on failure."
```

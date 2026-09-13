# 4.4 Stringer

`fmt.Stringer` is a small standard interface with one method: `String() string`.
Formatting functions can use it to obtain a human-readable description of your type.
This is useful for diagnostics and command output, but it is not a serialization format.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Price struct { Cents int }
  func (p Price) String() string {
      return fmt.Sprintf("%d.%02d EUR", p.Cents/100, p.Cents%100)
  }

  func main() {
      p := Price{Cents: 1299}
      fmt.Println(p)
      fmt.Printf("%s\n", p.String())
  }

  // Output:
  // 12.99 EUR
  // 12.99 EUR
hotspots: [{"line": 8, "match": "String() string", "title": "Exact interface method", "note": "The spelling, parameters, and result must match fmt.Stringer."}, {"line": 9, "match": "p.Cents/100", "title": "Format underlying fields", "note": "The example supports nonnegative cents; use domain validation for prices."}, {"line": 14, "match": "fmt.Println(p)", "title": "Automatic formatting", "note": "fmt uses the String method to describe this value."}]
```

## Avoid recursive formatting

Do not implement String by calling `fmt.Sprintf("%v", p)` on the same receiver: formatting
p invokes String again and recurses. Format its fields or convert a named scalar to its
underlying type. `fmt.Sprintf("%d", int(state))` avoids calling a named integer's String
method again.

A value receiver makes String available on both the value and its pointer. A pointer
receiver is appropriate for types that should not be copied, but then formatting a value
instead of a pointer may not use the method. Decide whether a nil pointer receiver has a
useful printable form.

Keep String cheap and free of surprising side effects. Logging should not make network
requests, mutate the object, or reveal secrets. Prefer a redacted representation for
credentials and tokens. If a stable machine-readable representation is needed, define
an encoding contract such as JSON instead of parsing the output of String.

## Check your understanding

```quiz
type: "mcq"
question: "Why is fmt.Sprintf(\"%v\", p) dangerous inside p.String()?"
options: ["It removes all fields", "It can call String again recursively", "It always refuses custom types"]
answer: 1
explain: "Formatting the same Stringer with %v re-enters its String method."
```

```quiz
type: "mcq"
question: "Should an API client parse a String method’s output as its data contract?"
options: ["Yes, String is a stable encoding protocol", "No, use a defined serialization format", "Only if the type has one field"]
answer: 1
explain: "String is intended for human-readable formatting unless a separate explicit contract says otherwise."
```

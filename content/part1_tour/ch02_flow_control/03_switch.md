# 2.3 switch

A `switch` selects the first matching case. Unlike many C-style languages, Go normally
stops after that case without an explicit `break`. Cases can contain expressions and
several comma-separated values.

A switch without an expression is equivalent to switching on true. It is a readable
way to classify values using ordered boolean conditions.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      status := 204
      switch {
      case status >= 500:
          fmt.Println("server failure")
      case status >= 400:
          fmt.Println("client failure")
      case status >= 200 && status < 300:
          fmt.Println("success")
      default:
          fmt.Println("other")
      }
  }

  // Output:
  // success
hotspots: [{"line": 9, "match": "switch {", "title": "Switch on true", "note": "The cases are boolean expressions, evaluated in source order."}, {"line": 10, "match": "case status >= 500:", "title": "Most specific condition first", "note": "The first matching case wins; order overlapping conditions deliberately."}, {"line": 16, "match": "default:", "title": "Fallback", "note": "Runs if no case matches. A default clause is optional."}]
```

## Values, order, and fallthrough

For exact values, use `switch method { case "GET", "HEAD": ... }`. Go evaluates the
switch expression once, then tests cases in order until one matches. A short statement
is also allowed: `switch n := len(items); n { ... }`.

`fallthrough` explicitly executes the next case body without checking its condition.
It must be the final non-empty statement of a permitted case, and is rarely useful
for ordinary classification. Do not use it just because another language requires
breaks: Go already prevents accidental fallthrough.

A switch breaks only its own control flow. Inside a loop, use a labelled break or a
return when you need to leave more than the switch. A type switch, introduced later,
examines an interface's dynamic type rather than comparing ordinary values.

## Check your understanding

```quiz
type: "predict"
code: |
  n := 7
  switch {
  case n > 0:
      fmt.Println("positive")
  case n > 5:
      fmt.Println("large")
  }
options: ["positive", "large", "positive then large"]
answer: 0
explain: "Both conditions could be true, but only the first matching case executes."
```

```quiz
type: "mcq"
question: "What does fallthrough do?"
options: ["Tests the next case and runs it only if it matches", "Runs the next case body without testing its condition", "Restarts the switch"]
answer: 1
explain: "Fallthrough transfers control to the following case body. Normal Go switches do not need it."
```

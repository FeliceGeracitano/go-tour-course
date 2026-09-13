# 2.1 for — the only loop

Go uses `for` for counting, repeating while a condition holds, and walking collections.
The condition must be a boolean. Parentheses are unnecessary, but braces are required.

Start with a running total. On each iteration, inspect the counter before adding it:
the loop stops when the condition becomes false, so the upper bound is excluded.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      total := 0
      for i := 1; i < 4; i++ {
          total += i
      }
      fmt.Println(total)
  }

  // Output:
  // 6
hotspots: [{"line": 9, "match": "i := 1", "title": "Initialisation", "note": "Runs once before the first condition check. `i` belongs to the loop."}, {"line": 9, "match": "i < 4", "title": "Condition", "note": "Checked before every iteration, including the first. The body runs for 1, 2, and 3."}, {"line": 9, "match": "i++", "title": "Post statement", "note": "Runs after the body and after a `continue`; `++` is a statement, not a value."}]
```

## Other loop shapes

`for total < 100 { total += 10 }` is a while-style loop: omit the initial and post
statements and their semicolons. `for { ... }` runs until you return, break, or stop the
process. An omitted condition means true; it does not mean “run once.”

Use `break` to leave the nearest loop and `continue` to skip the rest of its current
iteration. In nested loops, a label lets either statement target an outer loop.
Use this sparingly when extracting a function would make the control flow clearer.

`for i, value := range values` visits a collection. The value is a copy; assign through
`values[i]` when you intend to change a slice element. Later lessons cover maps and
strings, whose iteration rules differ. A loop variable declared with `:=` has a fresh
instance per iteration in modules using Go 1.22 or newer.

```trace
code: |
  sum := 0
  for i := 1; i < 4; i++ {
      sum += i
  }
  fmt.Println(sum)
steps: [{"line": 1, "note": "Start with no terms.", "vars": {"sum": "0"}}, {"line": 3, "note": "First iteration adds 1.", "vars": {"i": "1", "sum": "1"}}, {"line": 3, "note": "Second iteration adds 2.", "vars": {"i": "2", "sum": "3"}}, {"line": 3, "note": "Third iteration adds 3.", "vars": {"i": "3", "sum": "6"}}, {"line": 5, "note": "i reaches 4, so the loop ends.", "vars": {"sum": "6"}, "out": "6\n"}]
```

## Check your understanding

```quiz
type: "predict"
code: |
  n := 0
  for i := 0; i < 5; i++ {
      if i == 2 { continue }
      n++
  }
  fmt.Println(n)
options: ["4", "5", "2"]
answer: 0
explain: "There are five iterations, but the one with i equal to 2 skips n++. The post statement still advances i."
```

```quiz
type: "mcq"
question: "Where can the i declared by for i := 0; i < 3; i++ be used?"
options: ["Anywhere in the package", "Inside the loop condition, post statement, and body", "Only inside the post statement"]
answer: 1
explain: "The loop declaration has loop scope. Referencing i after the loop is a compile error."
```

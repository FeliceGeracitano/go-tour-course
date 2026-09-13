# Sentinel vs typed errors

Use a sentinel error for a stable category and a typed error when callers need
structured information. Neither choice requires callers to parse human-readable text.

A stock reservation can expose both: a caller can ask whether stock is insufficient,
then optionally inspect the available quantity.

## Read the example

```annotate
code: |
  package main

  import (
      "errors"
      "fmt"
  )

  var ErrStock = errors.New("insufficient stock")
  type StockError struct { Want, Have int }
  func (e *StockError) Error() string { return fmt.Sprintf("want %d, have %d", e.Want, e.Have) }
  func (e *StockError) Unwrap() error { return ErrStock }
  func reserve(want, have int) error {
      if want > have { return &StockError{Want: want, Have: have} }
      return nil
  }

  func main() {
      err := reserve(5, 2)
      fmt.Println(errors.Is(err, ErrStock))
      var shortage *StockError
      if errors.As(err, &shortage) { fmt.Println(shortage.Want, shortage.Have) }
  }

  // Output:
  // true
  // 5 2
hotspots: [{"line": 8, "match": "var ErrStock", "title": "Stable sentinel", "note": "One exported value identifies the category; errors.New on every call would create distinct values."}, {"line": 9, "match": "StockError struct", "title": "Structured detail", "note": "Callers can read quantities without parsing the Error string."}, {"line": 11, "match": "Unwrap() error", "title": "Bridge category and detail", "note": "The typed error also exposes the sentinel to errors.Is."}]
```

## Choose what callers actually need

A sentinel is enough when all callers take the same action for a category. A typed error
is appropriate when a response needs a field name, retry time, or conflict revision.
Adding exported fields is an API design decision: document units, meaning, and which
values are safe to expose to users.

This example's reserve function only demonstrates error classification. A real stock
system must atomically check and update stock, and validate quantities independently.
Returning a rich error does not solve a race between availability checks and writes.

Prefer errors.Is and errors.As in callers so additional context can be wrapped later.
Keep error messages useful for humans, and keep machine decisions tied to documented
values or types. Avoid a huge global list of sentinels for conditions no caller can
meaningfully distinguish.

## Check your understanding

```quiz
type: "mcq"
question: "Which representation best communicates a retry delay callers must inspect?"
options: ["Only the text \"try later\"", "A typed error with a documented delay field", "A newly allocated error with identical text each time"]
answer: 1
explain: "Structured information belongs in a typed contract rather than a string parser."
```

```quiz
type: "mcq"
question: "Does errors.New(\"missing\") equal another errors.New(\"missing\")?"
options: ["Yes, text determines equality", "No, they are separate error values", "Only inside the same package"]
answer: 1
explain: "Reuse a sentinel value for identity-based categories."
```

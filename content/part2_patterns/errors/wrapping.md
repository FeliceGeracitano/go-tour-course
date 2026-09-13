# Wrapping with %w, errors.Is / errors.As

A service often needs to add context to an error while letting its caller recognize
the underlying failure. Use `fmt.Errorf` with `%w` to preserve that relationship, then
`errors.Is` or `errors.As` to inspect it.

Use this when translating operations such as “load basket” into a caller-visible failure
without losing the original category or structured fields.

## Read the example

```annotate
code: |
  package main

  import (
      "errors"
      "fmt"
  )

  var ErrMissing = errors.New("missing")
  type FieldError struct { Field string }
  func (e *FieldError) Error() string { return "invalid field: " + e.Field }

  func main() {
      err := fmt.Errorf("load basket: %w", ErrMissing)
      fmt.Println(errors.Is(err, ErrMissing))
      var detail *FieldError
      err = fmt.Errorf("checkout: %w", &FieldError{Field: "postcode"})
      if errors.As(err, &detail) { fmt.Println(detail.Field) }
  }

  // Output:
  // true
  // postcode
hotspots: [{"line": 13, "match": "%w", "title": "Attach a cause", "note": "The new error carries context and an unwrap relationship."}, {"line": 14, "match": "errors.Is(err, ErrMissing)", "title": "Match a category", "note": "This checks the wrapping tree rather than only the outer error value."}, {"line": 17, "match": "errors.As(err, &detail)", "title": "Extract structured information", "note": "Pass a pointer to the target variable; detail is populated when a matching error is found."}]
```

## Define the public failure contract

Use Is when the caller needs a category such as “not found.” Use As when the caller
needs fields such as which input failed. A direct equality check or type assertion on
the outer error misses a wrapped cause.

Wrapping exposes a cause to callers. If a storage library is an implementation detail,
translate its errors into your own stable domain categories instead of making every
caller depend on that library. Use `%v` when you deliberately want text without an
unwrap relationship, rather than accidentally losing the cause.

`errors.Join` combines several independent errors, for example a primary operation
failure and a cleanup failure. Is and As can traverse the resulting tree. Do not expect
`errors.Unwrap` alone to handle every joined-error shape. Also check for a nil error
before wrapping: adding an error wrapper is not a way to represent success.

## Check your understanding

```quiz
type: "mcq"
question: "Which check still works after several %w wrappers?"
options: ["err.Error() == \"missing\"", "errors.Is(err, ErrMissing)", "err == ErrMissing"]
answer: 1
explain: "Is follows supported wrapping relationships, while text and outer-value equality are brittle."
```

```quiz
type: "mcq"
question: "Why pass &detail to errors.As?"
options: ["As must replace the target variable with the matching error", "It converts every error to a string", "It avoids inspecting wrapped errors"]
answer: 0
explain: "The target is a variable of the error type you want to find; As writes the matching value into it."
```

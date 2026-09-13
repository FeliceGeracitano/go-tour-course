# Functional options

Functional options configure a constructor through small functions. They can give
optional settings clear names while leaving defaults usable. Use them when a type has
several independent options; a simple config struct is often enough for a smaller API.

Apply options, validate the final configuration, then construct the resource. Validation
should happen before opening sockets or starting goroutines.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "time"
  )

  type Client struct { timeout time.Duration }
  type Option func(*Client) error
  func WithTimeout(d time.Duration) Option {
      return func(c *Client) error {
          if d <= 0 { return fmt.Errorf("timeout must be positive") }
          c.timeout = d
          return nil
      }
  }
  func NewClient(options ...Option) (*Client, error) {
      c := &Client{timeout: 5 * time.Second}
      for _, option := range options {
          if option == nil { return nil, fmt.Errorf("nil option") }
          if err := option(c); err != nil { return nil, err }
      }
      return c, nil
  }

  func main() {
      c, err := NewClient(WithTimeout(2*time.Second))
      if err != nil { panic(err) }
      fmt.Println(c.timeout)
  }

  // Output:
  // 2s
hotspots: [{"line": 9, "match": "type Option func(*Client) error", "title": "Configuration operation", "note": "An option mutates construction-time state and can report invalid input."}, {"line": 18, "match": "timeout: 5 * time.Second", "title": "Useful default", "note": "Callers who omit this option still get a bounded timeout."}, {"line": 21, "match": "option(c)", "title": "Apply in supplied order", "note": "This example uses last-option-wins for repeated timeout options."}]
```

## Keep the API predictable

Document what happens when options repeat or conflict. Last-option-wins is common but
not mandatory; rejecting duplicates may be better for some settings. Validate relationships
between fields after applying all options if individual options cannot do that alone.

Do not retain caller-owned mutable slices or maps without deciding whether to copy them.
An option closure can capture a reference that the caller later changes. Construction
should establish an ownership contract, not leave live configuration changing unexpectedly.

Options should not hide unbounded work. If each option starts a goroutine, a later option
failure leaves cleanup complicated. Build plain configuration first and create resources
only after validation. For an API with two required values and one optional value, a
normal constructor plus a config struct may be clearer than many option functions.

## Check your understanding

```quiz
type: "mcq"
question: "WithTimeout(0) should…"
options: ["Silently disable all limits", "Return a validation error in this API", "Always panic"]
answer: 1
explain: "This constructor explicitly requires positive durations and returns configuration failures as errors."
```

```quiz
type: "mcq"
question: "When should resource creation happen relative to option validation?"
options: ["Before the first option", "After configuration is successfully validated", "Inside every option independently"]
answer: 1
explain: "Validating first avoids leaking partially constructed resources on later option failures."
```

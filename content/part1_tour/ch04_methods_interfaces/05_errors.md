# 4.5 Errors

Go represents ordinary failures as values. The built-in `error` interface requires
`Error() string`; functions commonly return `(value, error)` so callers can inspect the
failure before using the value.

Return nil on success. Treat the error result as part of the function's contract, not
as optional logging information.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "strconv"
  )

  func quantity(raw string) (int, error) {
      n, err := strconv.Atoi(raw)
      if err != nil { return 0, fmt.Errorf("quantity %q: %w", raw, err) }
      if n < 0 { return 0, fmt.Errorf("quantity must be nonnegative: %d", n) }
      return n, nil
  }

  func main() {
      n, err := quantity("-2")
      if err != nil {
          fmt.Println(err)
          return
      }
      fmt.Println(n)
  }

  // Output:
  // quantity must be nonnegative: -2
hotspots: [{"line": 10, "match": "if err != nil { return 0,", "title": "Handle the lower-level failure", "note": "Do not apply domain rules to a conversion that failed."}, {"line": 10, "match": "%w", "title": "Preserve the cause", "note": "Wrapping adds context while allowing errors.Is and errors.As to inspect the cause."}, {"line": 12, "match": "return n, nil", "title": "Successful result", "note": "A nil error signals that the returned quantity is valid."}]
```

## Decide who handles the failure

An error message should explain the failed operation and useful context. Lower layers
usually return errors; an application boundary decides whether to retry, translate to
an HTTP status, or log. Logging and returning the same failure at every layer produces
duplicate noise without improving recovery.

Do not branch on error text. Use `errors.Is` for a known sentinel or `errors.As` for a
structured error carrying fields. A custom error type implements Error just like any
other interface method. Wrapping an internal error exposes it to callers, so consider
whether that cause is part of the API you want to maintain.

A non-nil error usually means the other result is unusable, unless the function's
contract explicitly says otherwise. `io.Reader.Read` is a notable exception: it may
return useful bytes and an error together. Check each API's contract rather than
assuming every `(value, error)` pair has identical semantics.

## Check your understanding

```quiz
type: "mcq"
question: "What should a caller normally do with a non-nil error from quantity?"
options: ["Handle or return it before using n", "Ignore it if n is zero", "Panic unconditionally"]
answer: 0
explain: "The function does not promise a usable quantity on failure. The caller chooses a suitable recovery or propagation path."
```

```quiz
type: "mcq"
question: "What does %w add compared with formatting an error as plain text?"
options: ["It automatically retries", "It preserves an unwrap relationship", "It hides the error from the caller"]
answer: 1
explain: "The wrapped cause remains inspectable with errors.Is and errors.As."
```

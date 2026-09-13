# Table-driven tests

Table-driven tests separate cases from the code that exercises them. Each row names
an input, an expected result, and any expected failure. This keeps boundary cases visible
without repeating setup and assertions in separate test functions.

Save the complete example below as quantity_test.go in a module and run `go test -v .`.
The production helper is included in the same file here to make the example self-contained.

## Read the example

```annotate
code: |
  package main

  import (
      "strconv"
      "testing"
  )

  func validQuantity(raw string) bool {
      n, err := strconv.Atoi(raw)
      return err == nil && n > 0
  }
  func TestValidQuantity(t *testing.T) {
      cases := []struct { name, input string; want bool }{
          {"positive", "2", true},
          {"zero", "0", false},
          {"negative", "-1", false},
          {"text", "tea", false},
      }
      for _, tc := range cases {
          t.Run(tc.name, func(t *testing.T) {
              if got := validQuantity(tc.input); got != tc.want {
                  t.Errorf("validQuantity(%q) = %v; want %v", tc.input, got, tc.want)
              }
          })
      }
  }
hotspots: [{"line": 13, "match": "cases := []struct", "title": "Visible input matrix", "note": "Choose boundaries and invalid inputs, not just several similar successful cases."}, {"line": 20, "match": "t.Run(tc.name", "title": "Named subtest", "note": "Failures and focused runs identify the specific behavior."}, {"line": 22, "match": "t.Errorf", "title": "Report useful evidence", "note": "Include input, actual result, and expected result."}]
```

## Build cases from the contract

Pick empty input, boundaries, ordinary valid values, and each important failure category.
When testing an error-returning API, store the expected category and use errors.Is rather
than comparing text. Avoid deriving expected results by repeating the implementation's
algorithm inside the test.

A table is useful when all rows exercise the same flow. If several rows need entirely
different setup, splitting the tests can be clearer than adding many boolean flags and
branches to one generic harness. Use t.Fatal or t.Fatalf for setup failures that make
further checks meaningless, and Errorf when independent checks can continue.

Parallel subtests need independent data and resources. A table-driven structure does
not make a shared database, global variable, or reused pointer safe. Start with clear
sequential tests and add parallelism when the isolation is established.

## Check your understanding

```quiz
type: "mcq"
question: "Which case adds a new boundary to a positive-quantity test?"
options: ["Another large positive number", "Zero", "The same input with a different test name"]
answer: 1
explain: "Zero is exactly where the positive-quantity rule changes behavior."
```

```quiz
type: "mcq"
question: "Should a test compute want by calling the same function under test?"
options: ["Yes, to avoid duplication", "No, that cannot independently check the contract", "Only in subtests"]
answer: 1
explain: "Expected results should be independently specified, not obtained from the behavior being tested."
```

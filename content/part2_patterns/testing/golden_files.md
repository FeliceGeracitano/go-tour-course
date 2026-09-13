# Golden files

A golden file stores a reviewed expected output. It is useful for reports, generated
text, or complex formatting where a small inline assertion would hide important detail.
The file is the expected result, not a cache that tests regenerate automatically.

Create `testdata/report.golden` containing `items: 2` followed by a newline. Save this
self-contained example as report_test.go and run `go test .`.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "os"
      "testing"
  )

  func report(count int) string { return fmt.Sprintf("items: %d\n", count) }
  func TestReport(t *testing.T) {
      want, err := os.ReadFile("testdata/report.golden")
      if err != nil { t.Fatal(err) }
      got := report(2)
      if got != string(want) {
          t.Fatalf("report mismatch\ngot:  %q\nwant: %q", got, want)
      }
  }
hotspots: [{"line": 11, "match": "testdata/report.golden", "title": "Reviewed fixture", "note": "Commit this alongside the test so every machine compares with the same expectation."}, {"line": 13, "match": "got := report(2)", "title": "Generate actual output", "note": "The actual output comes from the behavior under test."}, {"line": 14, "match": "got != string(want)", "title": "Exact comparison", "note": "Newlines and whitespace are significant here because the report format defines them."}]
```

## Review changes instead of blessing them

When an intentional change alters output, regenerate the golden file with an explicit
maintenance command or update mode, then review the diff. Ordinary test runs and CI
must not update expectations just to turn a failure green. Missing fixtures should fail
rather than silently creating a new baseline.

Make the output deterministic. Inject time, sort unordered data, and replace temporary
paths only when those details are outside the contract. Over-normalizing can hide a
real defect. For JSON APIs, comparing decoded fields is often better than freezing
incidental whitespace in a golden file.

Keep golden files small enough to review. If a change modifies thousands of unrelated
lines, split fixtures by feature or scenario. A golden test should complement targeted
behavior assertions so a large diff does not obscure why the new output is correct.

## Check your understanding

```quiz
type: "mcq"
question: "Should normal CI rewrite a golden file when output differs?"
options: ["Yes, to keep tests current", "No, fail and require review", "Only if the new output is longer"]
answer: 1
explain: "Automatically accepting the new output removes the independent expectation."
```

```quiz
type: "mcq"
question: "What should happen when the expected fixture is missing?"
options: ["The test should fail", "The test should silently pass", "The test should use the actual output as expected"]
answer: 0
explain: "A missing reviewed baseline is a setup failure, not proof that behavior is correct."
```

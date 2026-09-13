# go test: run, bench, cover, race, fuzz

`go test` compiles test binaries and runs tests for the selected packages. Files ending
in `_test.go` hold tests, benchmarks, and fuzz targets. Start with a full package test run,
then use focused flags to investigate one behavior.

The commands below assume a module containing TestValidQuantity, BenchmarkJoin, and
FuzzReverse from the testing-pattern lessons. Run fuzzing in the package with that target.

## Read the example

```annotate
code: |
  go test ./...
  go test -run 'TestValidQuantity/zero' -v .
  go test -count=1 ./...
  go test -race ./...
  go test -coverprofile=coverage.out ./...
  go tool cover -func=coverage.out
  go test -run '^$' -bench BenchmarkJoin -benchmem .
  go test -fuzz FuzzReverse -fuzztime=10s .
hotspots: [{"line": 2, "match": "-run 'TestValidQuantity/zero'", "title": "Focus a test", "note": "The pattern selects the named test/subtest path; quote shell metacharacters."}, {"line": 3, "match": "-count=1", "title": "Avoid cached test results", "note": "Useful when you need a fresh execution instead of a cached successful result."}, {"line": 4, "match": "-race", "title": "Observe exercised data races", "note": "The detector instruments executed code; it does not prove all possible paths are race-free."}]
lang: "bash"
```

## Read results and budget the run

A cached result is labelled `(cached)`. Package-list mode can reuse successful test
results when relevant inputs and flags permit it. Use -count=1 when fresh execution is
part of the investigation, but do not make repeated identical runs a substitute for
understanding a failure.

Coverage measures executed statements, not requirement completeness. A high percentage
can still miss wrong assertions, error handling, or important combinations. Use the
coverage profile to find unvisited code, then decide which cases are meaningful.

`-run '^$'` skips ordinary named tests while `-bench` selects benchmarks. `-benchmem`
reports allocation measurements. `-fuzz` enables generated inputs; ordinary go test runs
the seed corpus without an open-ended fuzz session. Give exploratory fuzzing a time budget
and preserve discovered failures as regression cases.

Set `-timeout` when a hanging test should fail within a known budget. The race detector
has platform and cgo/toolchain requirements and adds overhead; use a supported native
CI environment. Neither coverage nor the race detector replaces realistic integration
tests for services and storage.

## Check your understanding

```quiz
type: "mcq"
question: "Which flag forces a fresh run instead of a cached successful test result?"
options: ["-count=1", "-v", "-benchmem"]
answer: 0
explain: "-count=1 disables test-result caching for that invocation."
```

```quiz
type: "mcq"
question: "Does 100% statement coverage prove the test assertions are correct?"
options: ["Yes", "No", "Only with -race"]
answer: 1
explain: "Coverage records execution, not whether the expected behavior was asserted."
```

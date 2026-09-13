# Benchmarks & fuzzing

Benchmarks measure a workload; fuzz tests search input space for violations of a
property. Neither replaces ordinary examples of expected behavior. A useful benchmark
resembles the operation you care about, and a useful fuzz property can be checked
independently of its implementation.

Save the example below as text_test.go. The benchmark uses B.Loop, introduced in Go
1.24. The fuzz test deliberately restricts inputs to valid UTF-8 before reversing runes.

## Read the example

```annotate
code: |
  package main

  import (
      "strings"
      "testing"
      "unicode/utf8"
  )

  func reverse(s string) string {
      r := []rune(s)
      for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 { r[i], r[j] = r[j], r[i] }
      return string(r)
  }
  func BenchmarkJoin(b *testing.B) {
      parts := []string{"tea", "coffee", "water"}
      b.ReportAllocs()
      for b.Loop() { strings.Join(parts, ",") }
  }
  func FuzzReverse(f *testing.F) {
      f.Add("Go")
      f.Add("café")
      f.Fuzz(func(t *testing.T, s string) {
          if !utf8.ValidString(s) { t.Skip() }
          if got := reverse(reverse(s)); got != s { t.Fatalf("round trip = %q; want %q", got, s) }
      })
  }
hotspots: [{"line": 16, "match": "b.ReportAllocs()", "title": "Allocation evidence", "note": "Report allocations along with time rather than assuming faster means less memory."}, {"line": 17, "match": "for b.Loop()", "title": "Benchmark loop", "note": "The testing package controls iteration count and excludes setup outside the loop."}, {"line": 23, "match": "utf8.ValidString", "title": "State the property’s domain", "note": "Converting invalid UTF-8 to runes replaces invalid bytes, so byte-for-byte reversal is not the right property there."}]
```

## Run and interpret deliberately

Use `go test -run '^$' -bench BenchmarkJoin -benchmem -count=5 .` for repeated measurements.
Compare distributions under similar machine load and input sizes. A single timing is
not a reliable performance claim. B.Loop helps prevent misleading elimination of calls
inside its direct loop; older `b.N` benchmarks often need a result sink and careful timer
management.

`go test .` runs fuzz seed cases as ordinary tests. `go test -fuzz FuzzReverse -fuzztime=10s .`
actively generates inputs. Preserve any discovered failure as a regression case. Fuzz
callbacks should be deterministic, fast, and free of shared mutable state.

Reversing twice is a useful property but does not prove a function reverses correctly:
an identity function also satisfies it. Add known input/output examples. Likewise, rune
reversal is not grapheme-aware text reversal; the property and intended user behavior
must agree.

## Check your understanding

```quiz
type: "mcq"
question: "Does ordinary go test actively fuzz indefinitely?"
options: ["Yes", "No, it runs seed cases unless fuzzing is requested", "Only if a benchmark exists"]
answer: 1
explain: "The -fuzz flag enables generated-input fuzzing."
```

```quiz
type: "mcq"
question: "Does reverse(reverse(s)) == s alone prove correct reversal?"
options: ["Yes", "No, an identity function also passes", "Only for ASCII"]
answer: 1
explain: "Properties need complementary examples and checks that distinguish incorrect implementations."
```

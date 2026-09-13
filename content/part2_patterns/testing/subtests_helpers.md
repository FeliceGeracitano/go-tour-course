# Subtests & t.Helper

Subtests give individual cases names and lifetimes. Helpers remove repeated setup or
assertion mechanics. Call t.Helper inside a helper so failures are attributed to the
call site that describes the case, rather than to the shared helper implementation.

Use t.Cleanup for resources that should survive until a test and its subtests finish.
This is especially important when subtests run in parallel.

## Read the example

```annotate
code: |
  package main

  import (
      "os"
      "path/filepath"
      "testing"
  )

  func requireText(t *testing.T, path, want string) {
      t.Helper()
      got, err := os.ReadFile(path)
      if err != nil { t.Fatal(err) }
      if string(got) != want { t.Fatalf("read %q = %q; want %q", path, got, want) }
  }
  func TestFiles(t *testing.T) {
      for _, name := range []string{"first", "second"} {
          t.Run(name, func(t *testing.T) {
              t.Parallel()
              dir := t.TempDir()
              path := filepath.Join(dir, "value.txt")
              if err := os.WriteFile(path, []byte(name), 0600); err != nil { t.Fatal(err) }
              requireText(t, path, name)
          })
      }
  }
hotspots: [{"line": 10, "match": "t.Helper()", "title": "Improve failure location", "note": "The testing package skips this helper when identifying the relevant call frame."}, {"line": 18, "match": "t.Parallel()", "title": "Declare isolated concurrent work", "note": "Each case has its own temporary directory and file."}, {"line": 19, "match": "t.TempDir()", "title": "Automatic test cleanup", "note": "The testing package removes this directory after the test lifetime ends."}]
```

## Parent lifetime versus subtest lifetime

Save the example as files_test.go and run `go test -run 'TestFiles/first' -v .` to select
one case. Slash-separated name components let the test runner filter parent and child
names separately.

A parallel subtest pauses until its parent test function returns. A defer in that parent
therefore runs before its parallel children finish. If the parent owns a shared server,
register its cleanup with t.Cleanup instead so the resource remains available through
subtest completion. Prefer per-subtest resources when practical.

Go 1.22+ gives loop variables declared with `:=` fresh per-iteration instances. Older
modules often need a `tc := tc` capture before creating a closure. Neither rule fixes
shared state referenced through pointers. Helpers should keep control flow obvious;
a helper calling Fatal must run in the test goroutine, not an arbitrary worker.

## Check your understanding

```quiz
type: "mcq"
question: "What does t.Helper change?"
options: ["Failure attribution", "Whether assertions run", "The function’s concurrency"]
answer: 0
explain: "It marks the calling function as a helper so diagnostic locations point at the relevant caller."
```

```quiz
type: "mcq"
question: "How should a parent clean up a server used by parallel subtests?"
options: ["A defer that closes it when the parent function returns", "t.Cleanup", "Close it in the first child"]
answer: 1
explain: "Cleanup waits for the test and its subtests, while a parent defer can run before parallel children finish."
```

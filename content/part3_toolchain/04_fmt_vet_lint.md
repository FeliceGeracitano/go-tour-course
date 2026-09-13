# fmt / vet / lint

Formatting, static analysis, and tests answer different questions. gofmt applies the
standard source format; go vet finds suspicious constructs; tests exercise chosen
behaviors. Use them together and understand which failures each can detect.

Run formatting locally, and let CI report unformatted files without silently rewriting
the change under review.

## Read the example

```annotate
code: |
  gofmt -w .
  gofmt -l .
  go fmt ./...
  go vet ./...
  go test ./...
hotspots: [{"line": 1, "match": "gofmt -w .", "title": "Rewrite formatting", "note": "This changes Go files in the specified directory tree. Review the diff before committing."}, {"line": 2, "match": "gofmt -l .", "title": "List formatting drift", "note": "The command lists files that differ; CI needs to assert that this output is empty."}, {"line": 4, "match": "go vet ./...", "title": "Find suspicious code", "note": "Examples include incorrect printf arguments and copying values containing locks."}]
lang: "bash"
```

## Keep checks focused

`go fmt ./...` formats files in packages selected by the go command; gofmt works directly
on files or directories. Gofmt does not automatically add every missing import or remove
all unused imports. Editor tooling such as gopls can organize imports as a separate action.

A command listing files does not necessarily fail its exit status merely because the
list is nonempty. In a POSIX CI shell, capture `gofmt -l .` and fail when the output contains
filenames. Scope the check to owned source, excluding generated or vendored trees according
to the project's policy.

Vet is not a proof of correctness and may have false positives or miss defects. An
additional analyzer such as Staticcheck can catch further mistakes, while a linter
aggregator can centralize several tools. Pin tool versions in CI and enable checks with
a clear purpose. Fix or narrowly document findings instead of globally suppressing checks
to clear a noisy build.

Formatting changes should be easy to separate from behavioral changes during review.
Run tests after semantic fixes; a clean formatting report says nothing about runtime
output, cancellation, or error handling.

## Check your understanding

```quiz
type: "mcq"
question: "Does gofmt -l . by itself guarantee CI fails when it lists files?"
options: ["Yes", "No, the script must check whether the list is empty", "Only for main packages"]
answer: 1
explain: "Listing formatting differences is not the same as enforcing a failing status for them."
```

```quiz
type: "mcq"
question: "Which tool is intended to flag a mismatched printf format argument?"
options: ["go vet", "go mod vendor", "go install"]
answer: 0
explain: "Vet includes analyzers for suspicious format-string usage."
```

## Further reading

[go vet analyzers](https://pkg.go.dev/cmd/vet)

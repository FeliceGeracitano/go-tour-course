# Cross-compile & release

Go can build for another supported operating system and architecture by setting GOOS
and GOARCH. That produces a target executable; it does not let the host execute it or
prove that target-specific behavior works.

The commands below assume the module-layout example has cmd/server. The environment
assignment syntax is for a POSIX shell; use your shell's equivalent on Windows.

## Read the example

```annotate
code: |
  go tool dist list
  go env GOOS GOARCH CGO_ENABLED
  go test ./...
  mkdir -p dist
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -o dist/server-linux-amd64 ./cmd/server
  CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -trimpath -o dist/server-linux-arm64 ./cmd/server
  go version -m dist/server-linux-amd64
hotspots: [{"line": 1, "match": "go tool dist list", "title": "Supported target pairs", "note": "Check supported OS/architecture combinations instead of inventing one."}, {"line": 5, "match": "CGO_ENABLED=0", "title": "Pure-Go build path", "note": "This avoids a C cross-compiler only when the program and dependencies support building without cgo."}, {"line": 5, "match": "-trimpath", "title": "Remove build filesystem paths", "note": "This helps reproducibility but is not by itself a complete reproducible-build guarantee."}]
lang: "bash"
```

## Test on the target and record provenance

A Linux executable normally cannot run directly on macOS. Build success is only the
first check; run smoke tests in the actual target environment or an appropriate container
or VM. `GOOS=linux go test ./...` on a different host can compile tests and then fail to
execute them. `go test -c` builds a test binary for one package when execution is handled
elsewhere.

Cgo dependencies may require a target C compiler, headers, and compatible runtime
libraries. Disabling cgo can change available functionality or implementation choices,
so verify the resulting application rather than assuming all behavior is identical.
Architecture-specific code and build tags also change which files are selected.

For a release, pin the Go toolchain and dependency inputs, run checks, build named
artifacts, test them, and publish checksums with a release note. `go version -m` displays
embedded module/build information where available. Keep credentials out of linker flags
and binaries; embedding a value does not make it secret. Decide target support explicitly
instead of generating every possible binary without testing them.

## Check your understanding

```quiz
type: "mcq"
question: "What does successful cross-compilation prove?"
options: ["The binary has passed runtime tests on the target", "The selected target code builds", "The host can execute it"]
answer: 1
explain: "Runtime behavior still needs target-environment verification."
```

```quiz
type: "mcq"
question: "Can CGO_ENABLED=0 be used for every Go project without consequences?"
options: ["Yes", "No, some dependencies require cgo or change behavior without it", "Only when GOARCH is amd64"]
answer: 1
explain: "Pure-Go builds work only when the dependency graph supports them."
```

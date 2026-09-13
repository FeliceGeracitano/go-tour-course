# Modules: tidy, why, vendor, work

A module's go.mod declares its identity, Go version requirement, and selected dependency
requirements. go.sum records checksums. Use module commands to maintain and explain that
graph rather than editing dependencies as if they were copied source folders.

Run these inspection commands from a module root. A dependency-free module may have no
go.sum and no third-party modules to vendor.

## Read the example

```annotate
code: |
  go env GOMOD
  go mod tidy
  go list -m all
  go mod why -m golang.org/x/sync
  go mod graph
  go mod vendor
  go test -mod=vendor ./...
hotspots: [{"line": 2, "match": "go mod tidy", "title": "Reconcile source and requirements", "note": "Add needed requirements and remove unused ones, including dependencies needed by tests."}, {"line": 4, "match": "go mod why -m", "title": "Explain a dependency path", "note": "The output explains why a module is needed, or says the main module does not need it."}, {"line": 6, "match": "go mod vendor", "title": "Create a vendor tree", "note": "Regenerate after dependency changes; vendor is not automatically kept in sync."}]
lang: "bash"
```

## Add, update, and work across modules

`go get golang.org/x/sync@v0.16.0` selects that reviewed example version and updates module
metadata. After importing errgroup in your code, run tidy and review the go.mod/go.sum
diff. A checksum file is not a lockfile listing the exact build graph: version selection
comes from the module requirements and Go's module rules.

For two local modules in sibling directories, create a workspace from their parent:

```bash
go work init ./service ./shared
go work sync
```

Both directories must already contain go.mod. A go.work file lets local modules be used
together without temporary replace edits. `GOWORK=off go test ./...` checks a module
without workspace substitutions, useful before publishing it independently.

Vendoring copies dependencies for the main module's build and tests into vendor. It does
not make every tool download or module command offline. Keep vendor/modules.txt consistent
with go.mod. Private modules may need GOPRIVATE configuration; do not publish credentials
in go.mod, URLs, or committed environment files.

## Check your understanding

```quiz
type: "mcq"
question: "Is go.sum a conventional lockfile that alone selects every build version?"
options: ["Yes", "No, it records checksums", "Only when vendor exists"]
answer: 1
explain: "The selected module graph comes from requirements and version-selection rules; go.sum verifies downloaded content."
```

```quiz
type: "mcq"
question: "Why test with GOWORK=off before publishing one module?"
options: ["To check it does not depend on local workspace substitutions", "To disable all dependencies", "To skip tests"]
answer: 0
explain: "A workspace can hide an undeclared or incorrectly versioned dependency."
```

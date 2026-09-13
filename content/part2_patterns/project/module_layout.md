# Module layout

A module is a versioned collection of packages; a package is normally one directory
of Go files. Organize packages around responsibilities and dependency direction, not
around a fixed architecture template applied before the code needs it.

For a small service, a command package can own startup while internal packages own
business behavior. The sample below belongs in cmd/server/main.go.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "example.com/shop/internal/catalog"
  )

  func main() {
      fmt.Println(catalog.Label("tea"))
  }
hotspots: [{"line": 1, "match": "package main", "title": "Executable entry point", "note": "Command packages have a main function. Library packages expose reusable behavior."}, {"line": 5, "match": "example.com/shop/internal/catalog", "title": "Module-relative import path", "note": "The path combines the module directive with the package directory."}, {"line": 9, "match": "catalog.Label", "title": "Exported package API", "note": "The command uses a narrow package API instead of reaching into its storage details."}]
```

## Complete the small module

Create this directory layout:

```text
shop/
  go.mod
  cmd/server/main.go
  internal/catalog/catalog.go
```

The module file contains `module example.com/shop` and a `go 1.25.0` directive. In
`internal/catalog/catalog.go`, put:

```go
package catalog

func Label(name string) string { return "product: " + name }
```

From the module root, `go run ./cmd/server` prints `product: tea`. Run `go test ./...`
to discover all packages. The example.com path is local module identity; publishing a
real reusable module requires a reachable module path and release strategy.

An internal directory restricts imports to code under its parent tree. A package under
`example.com/shop/internal` is accessible to this service but not an unrelated module.
Package import cycles are rejected: split shared contracts or move orchestration upward
instead of adding circular imports.

Avoid creating one module per package unless independent versioning is actually needed.
Keep main focused on configuration, construction, and lifetime. Add new packages when
they establish useful boundaries; folders named utils or common often collect unrelated
responsibilities and make dependency direction harder to follow.

## Check your understanding

```quiz
type: "mcq"
question: "Does every package directory need its own go.mod?"
options: ["Yes", "No, one module can contain many packages", "Only internal directories do"]
answer: 1
explain: "go.mod defines a module boundary, not every package boundary."
```

```quiz
type: "mcq"
question: "What happens when package A imports B and B imports A?"
options: ["Go initializes them alphabetically", "The import cycle is rejected", "It works if both are internal"]
answer: 1
explain: "Package dependencies must be acyclic."
```

## Further reading

[Official module layout guidance](https://go.dev/doc/modules/layout)

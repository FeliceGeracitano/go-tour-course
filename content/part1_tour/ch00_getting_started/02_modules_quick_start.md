# 0.2 Modules quick start

A **module** is a tree of packages with a `go.mod` file at its root. The file names the
module and pins the versions of everything it depends on. Since Go 1.16 you always work
inside a module.

```annotate
lang: text
code: |
  module example.com/greetings

  go 1.25

  require rsc.io/quote/v4 v4.0.1
hotspots:
  - { line: 1, match: "module example.com/greetings", title: "Module path", note: "Also the import-path prefix for every package inside the module. For code you publish, use the repository path, e.g. `github.com/you/greetings`." }
  - { line: 3, match: "go 1.25", title: "Language version", note: "The minimum Go version this module needs. A newer toolchain honours it; an older one refuses to build (or downloads the right toolchain, since Go 1.21)." }
  - { line: 5, match: "require", title: "Dependencies", note: "Added by `go get` or `go mod tidy`, always with an **exact version**. The `go.sum` file next to it stores checksums so builds are reproducible." }
```

## The commands you will use daily

```bash
go mod init example.com/greetings   # create go.mod in the current directory
go get rsc.io/quote/v4              # add a dependency (updates go.mod and go.sum)
go mod tidy                         # add missing requirements, drop unused ones
go run .                            # build and run the main package in this directory
```

## Packages inside a module

One directory = one package. To import a package from your own module, use the module
path plus the directory:

```go
package main

import (
    "fmt"

    "example.com/greetings/internal/words"
)

func main() {
    fmt.Println(words.Pick())
}
```

Anything under a directory named `internal/` can only be imported by code rooted at the
parent of `internal/` — a compiler-enforced "private to this module".

```quiz
type: mcq
question: Where does `go get` store downloaded modules?
options: ["In a node_modules-style folder inside the project", "In a shared module cache (see `go env GOMODCACHE`)", "Always copied into ./vendor"]
answer: 1
explain: "Modules go into one cache shared by every project on the machine, so a version is downloaded once. `go mod vendor` copies them into ./vendor only if you ask for it."
```

```quiz
type: mcq
question: Which import is allowed from package `example.com/app/cmd/server`?
options: ["example.com/app/internal/db", "example.com/other/internal/db", "Both"]
answer: 0
explain: "`internal/` packages are importable only from within the tree rooted at the directory that contains `internal/`. `example.com/app/...` qualifies; `example.com/other` does not."
```

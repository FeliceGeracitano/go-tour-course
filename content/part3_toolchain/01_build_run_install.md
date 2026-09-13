# build / run / install

The go command works with packages and modules. `go run` builds and executes a main
package for immediate use; `go build` creates or checks build output; `go install`
installs a command into a binary directory.

Try the following in a new empty practice directory. Use Go 1.25 or newer for the
course's complete set of examples, and inspect your installed version with `go version`.

## Read the example

```annotate
code: |
  go mod init example.com/hello
  cat > main.go <<'EOF'
  package main
  import "fmt"
  func main() { fmt.Println("hello Go") }
  EOF
  go run .
  go build -o hello .
  ./hello
  go install .
  go env GOBIN GOPATH
hotspots: [{"line": 7, "match": "go run .", "title": "Build and execute", "note": "The current package must be a main package. Arguments after the package are passed to the program."}, {"line": 8, "match": "go build -o hello .", "title": "Keep an executable", "note": "The output path is explicit; on Windows choose hello.exe and run it with the appropriate shell syntax."}, {"line": 10, "match": "go install .", "title": "Install the command", "note": "The binary goes to GOBIN, or the bin directory under GOPATH when GOBIN is unset."}]
lang: "bash"
```

## Packages versus individual files

The commands use a POSIX-style shell. `go run .` includes the package's eligible Go
files; `go run main.go` names an explicit file set and can accidentally omit other files
in the package. Prefer package paths for a growing project.

`go build ./...` compiles packages recursively but does not run their tests. Building
library packages generally checks and caches them rather than placing a library file
in the current directory. `go test ./...` is a separate validation step.

For an external command, `go install module/path/cmd/tool@version` selects a version and
installs it without adding it as an application dependency. Choose a reviewed version
for reproducible tooling. Ensure the installation directory is on PATH before assuming
the command can be found.

Use `go env GOMOD` to see which module you are in and `go env GOCACHE` to locate the build
cache. Modules and compiled artifacts have separate caches. A successful go run does not
produce the named release artifact your deployment expects; use an explicit build step.

## Check your understanding

```quiz
type: "mcq"
question: "Which command both builds and immediately executes the current main package?"
options: ["go run .", "go build .", "go mod tidy"]
answer: 0
explain: "go run is the immediate execution workflow; build only creates or checks artifacts."
```

```quiz
type: "mcq"
question: "Does go build ./... run unit tests?"
options: ["Yes", "No", "Only if _test.go files exist"]
answer: 1
explain: "Use go test to compile and run test code."
```

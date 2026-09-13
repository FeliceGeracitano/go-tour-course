# 0.1 Install & hello, world

Go ships as **one toolchain**: the `go` command builds, runs, tests, formats, and manages
dependencies. There is no separate build system to learn.

## Install

Download from <https://go.dev/dl/> or use a package manager:

```bash
brew install go                 # macOS
sudo apt install golang-go      # Debian/Ubuntu (distro packages lag; go.dev/dl is newer)
go version                      # go version go1.25.1 darwin/arm64
```

## Your first program

Click the highlighted parts to see what each one does.

```annotate
code: |
  package main

  import "fmt"

  func main() {
      fmt.Println("Hello, 世界")
  }
hotspots:
  - { line: 1, match: "package main", title: "The main package", note: "Every Go file starts with a `package` clause. `main` is special: it tells the toolchain to build an **executable**, not a library.", link: "https://go.dev/tour/basics/1" }
  - { line: 3, match: 'import "fmt"', title: "Imports", note: "`fmt` (format) is the standard-library package for printing. An **unused import is a compile error**, not a warning." }
  - { line: 5, match: "func main()", title: "Entry point", note: "Execution starts at `main.main`. It takes no arguments and returns nothing; use `os.Exit(code)` for a non-zero exit status." }
  - { line: 6, match: "Println", title: "Println", note: "Prints its arguments separated by spaces and ends with a newline. Names that start with a **capital letter are exported** — that is why it is `Println`, not `println`.", link: "https://pkg.go.dev/fmt#Println" }
  - { line: 6, match: "世界", title: "UTF-8 source", note: "Go source files are UTF-8. String literals can hold any Unicode text; a `string` is a sequence of bytes underneath." }
```

## Run it

```bash
mkdir hello && cd hello
go mod init example.com/hello     # creates go.mod (more in 0.2)
# save the program above as main.go
go run .                          # compile to a temp dir and run
go build -o hello .               # or produce a ./hello binary
```

`go run` is for iterating; `go build` gives you a single static binary you can copy anywhere.

```quiz
type: mcq
question: What happens if you import a package and never use it?
options: ["Nothing — the compiler drops it", "A warning is printed", "The program does not compile"]
answer: 2
explain: "Go treats unused imports (and unused local variables) as compile errors. Editors run `goimports`, which adds and removes imports for you as you type."
```

```quiz
type: predict
code: |
  package main

  import "fmt"

  func main() {
      fmt.Println("a", 1, true)
  }
options: ["a1true", "a 1 true", "a, 1, true"]
answer: 1
explain: "Println inserts a single space between operands and appends a newline. `Print` only adds spaces between operands when neither is a string; `Printf` gives you full control."
```

# 1.1 Packages, imports, exported names

Every Go program is made of **packages**. A program starts running in package `main`.
Files in the same directory belong to the same package and share its scope.

```annotate
code: |
  package main

  import (
      "fmt"
      "math"
  )

  func main() {
      fmt.Println(math.Pi)
  }
hotspots:
  - { line: 3, match: "import (", title: "Factored import", note: "Group imports in parentheses instead of repeating `import` per line. `gofmt` sorts them; keep standard-library imports in one block and third-party ones in another.", link: "https://go.dev/tour/basics/2" }
  - { line: 5, match: '"math"', title: "Package path vs name", note: "You import a **path** (`\"math/rand\"`) and refer to the package by its **name** — by convention the last element of the path (`rand`)." }
  - { line: 9, match: "math.", title: "Qualified identifier", note: "Anything from another package is written `pkg.Name`. There is no way to import names unqualified into your scope (dot-imports exist but are frowned upon)." }
  - { line: 9, match: "Pi", title: "Exported name", note: "A name is **exported** when it begins with a capital letter. `math.Pi` is visible outside `math`; `math.pi` would not be — and would not compile.", link: "https://go.dev/tour/basics/3" }
```

## Exported means capitalised

There is no `public` keyword. Visibility is decided by the first letter of the name:

| Name | Visible outside its package? |
|---|---|
| `Println`, `Pi`, `Reader` | yes |
| `println`, `pi`, `reader` | no |

This applies to functions, types, struct fields, methods, constants, and variables alike.

```quiz
type: spotline
question: Which line does not compile?
code: |
  package main

  import "math"

  func main() {
      println(math.pi)
  }
answer: 6
explain: "`math.pi` is unexported (lowercase) so it is not accessible from package main — the error is `undefined: math.pi`. Note that `println` itself compiles: it is a built-in, though you should use `fmt` in real code."
```

```quiz
type: mcq
question: What determines whether a name is exported?
options: ["A `pub` or `export` keyword", "The first letter being uppercase", "Being declared in package main"]
answer: 1
explain: "Capital first letter = exported. This is the whole rule, and it is why Go APIs look like `http.Get` and `json.Marshal`."
```

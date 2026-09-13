# 1.3 Variables

`var` declares a list of variables; the type comes last. Inside a function, `:=` declares
and initialises in one step and infers the type.

```annotate
code: |
  var c, python, java bool

  var i, j int = 1, 2

  func main() {
      var k = 3
      name, ok := "gopher", true
      fmt.Println(c, python, java, i, j, k, name, ok)
  }
hotspots:
  - { line: 1, match: "var c, python, java bool", title: "Package-level var", note: "Declared without an initialiser, so each gets the **zero value** for its type — `false` here. Package-level variables live for the whole program.", link: "https://go.dev/tour/basics/8" }
  - { line: 3, match: "int = 1, 2", title: "Type + initialiser", note: "With initialisers you may drop the type: `var i, j = 1, 2` infers `int`. One initialiser per variable.", link: "https://go.dev/tour/basics/9" }
  - { line: 6, match: "var k = 3", title: "Inferred type", note: "`3` is an untyped integer constant; assigned to a variable it becomes `int`." }
  - { line: 7, match: ":=", title: "Short variable declaration", note: "`name, ok := ...` declares **and** initialises. Only allowed inside functions; at package level every statement begins with a keyword (`var`, `func`, …).", link: "https://go.dev/tour/basics/10" }
```

## Rules worth memorising

- **Zero values**: `0` for numbers, `false` for bools, `""` for strings, `nil` for
  pointers, slices, maps, channels, functions, and interfaces. There is no "uninitialised".
- **Unused local variables are a compile error.** Unused package-level variables are fine.
- **`:=` needs at least one new variable on the left.** Re-using `err` across calls works
  because the other name is new each time:

```go
data, err := os.ReadFile("a.txt")   // declares data, err
more, err := os.ReadFile("b.txt")   // declares more; reuses err — OK
```

```quiz
type: spotline
question: Which line does not compile?
code: |
  package main

  x := 1

  func main() {
      fmt.Println(x)
  }
answer: 3
explain: "`:=` is only allowed inside functions. At package level write `var x = 1`."
```

```quiz
type: predict
code: |
  var s string
  var n int
  var p *int
  fmt.Println(s == "", n, p == nil)
options: ["true 0 true", "false 0 false", "<nil> 0 true"]
answer: 0
explain: "Every variable starts at its zero value: the empty string, 0, and nil for a pointer."
```

```quiz
type: mcq
question: |
  Does this compile?
  `a, err := f()` then on the next line `b, err := g()`
options: ["Yes — b is new, err is reused", "No — err is redeclared", "Only if err is declared with var first"]
answer: 0
explain: "`:=` may redeclare variables that already exist in the same scope as long as at least one variable on the left is new. This is why chains of `x, err := ...` are idiomatic."
```

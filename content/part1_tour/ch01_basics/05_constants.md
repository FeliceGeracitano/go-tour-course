# 1.5 Constants & iota

Constants are declared with `const` and can be characters, strings, booleans, or numbers.
They cannot be declared with `:=`, and their value must be known at compile time.

```annotate
code: |
  const Pi = 3.14

  const (
      Big   = 1 << 100
      Small = Big >> 99
  )

  const (
      _  = iota
      KB = 1 << (10 * iota)
      MB
      GB
  )
hotspots:
  - { line: 1, match: "const Pi", title: "Untyped constant", note: "`Pi` has no fixed type until it is used. Passed to a `float32` parameter it becomes `float32`; to a `float64` one, `float64`.", link: "https://go.dev/tour/basics/15" }
  - { line: 4, match: "1 << 100", title: "Bigger than any int", note: "Constant expressions are computed with arbitrary precision. `Big` cannot be stored in a variable of any integer type, but it is a valid constant.", link: "https://go.dev/tour/basics/16" }
  - { line: 5, match: "Big >> 99", title: "Shift it back", note: "`Small` is 2. Constants can be built from other constants freely." }
  - { line: 9, match: "_  = iota", title: "iota", note: "`iota` counts declarations within a `const` block starting at 0. Assigning it to the blank identifier skips the zero value." }
  - { line: 10, match: "1 << (10 * iota)", title: "Expression with iota", note: "On this line iota is 1, so KB = 1 << 10 = 1024." }
  - { line: 11, match: "MB", title: "Implicit repetition", note: "A constant with no expression **repeats the previous expression** with the new iota: MB = 1 << 20, GB = 1 << 30." }
```

## Typed vs untyped

```go
const a = 1          // untyped integer constant
const b int64 = 1    // typed
var f float64 = a    // OK: untyped 1 becomes float64
var g float64 = b    // compile error: int64 is not float64
```

Untyped constants make numeric code pleasant: `time.Second * 2` works because `2` adapts to
`time.Duration`.

```quiz
type: predict
code: |
  const (
      A = iota
      B
      C = "x"
      D
      E = iota
  )
  fmt.Println(A, B, C, D, E)
options: ["0 1 x x 4", "0 1 x x 2", "0 1 x 3 4"]
answer: 0
explain: "iota keeps counting on every line (0,1,2,3,4) even when the expression does not use it. B repeats `iota` → 1; D repeats `\"x\"` → x; E is on the fifth line → 4."
```

```quiz
type: mcq
question: |
  Given `const Big = 1 << 100` and `func needInt(x int) int`, what happens on `needInt(Big)`?
options: ["It compiles; the value wraps around", "It compiles; Big is silently converted to float64", "Compile error: constant overflows int"]
answer: 2
explain: "Untyped constants may be huge, but the moment one is used where an `int` is needed it must fit. `1 << 100` does not, so the compiler rejects it — no runtime surprises."
```

```quiz
type: spotline
question: Which line does not compile?
code: |
  const limit = 10
  limit := 20
  var x = limit
answer: 2
explain: "A constant is not a variable: it cannot be redeclared or assigned. Line 2 tries to declare a new `limit` in the same scope as the constant."
```

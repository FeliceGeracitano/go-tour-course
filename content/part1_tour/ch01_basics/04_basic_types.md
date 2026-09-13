# 1.4 Basic types, zero values, conversions

Go's basic types:

| Kind | Types |
|---|---|
| boolean | `bool` |
| text | `string` |
| signed ints | `int` `int8` `int16` `int32` `int64` |
| unsigned ints | `uint` `uint8` `uint16` `uint32` `uint64` `uintptr` |
| aliases | `byte` (= `uint8`), `rune` (= `int32`, a Unicode code point) |
| floats | `float32` `float64` |
| complex | `complex64` `complex128` |

`int`, `uint`, and `uintptr` are 64 bits wide on 64-bit systems. Use `int` unless you have a
specific reason (a wire format, a very large array) to pick a sized type.

```annotate
code: |
  var (
      ToBe   bool       = false
      MaxInt uint64     = 1<<64 - 1
      z      complex128 = cmplx.Sqrt(-5 + 12i)
  )
hotspots:
  - { line: 1, match: "var (", title: "Factored var block", note: "Like imports, `var` declarations can be grouped. `gofmt` aligns the names, types, and values into columns.", link: "https://go.dev/tour/basics/11" }
  - { line: 3, match: "1<<64 - 1", title: "Constant arithmetic", note: "Untyped constants are evaluated with **arbitrary precision** at compile time. `1<<64` would overflow any variable, but as a constant expression `1<<64 - 1` is fine and fits `uint64` exactly." }
  - { line: 4, match: "12i", title: "Imaginary literal", note: "`12i` is an imaginary constant; `-5 + 12i` is a complex constant. `cmplx` is the complex-number sibling of `math`." }
```

## Zero values

Variables declared without an explicit initial value get their **zero value**: `0`, `false`,
`""`, and `nil` for pointers, slices, maps, channels, functions, and interfaces. Design
types so their zero value is useful (a `bytes.Buffer` or `sync.Mutex` needs no constructor).

## Conversions are always explicit

```go
var i int = 42
var f float64 = float64(i)
var u uint = uint(f)
```

`T(v)` converts `v` to type `T`. There is **no implicit numeric conversion**, not even from
`int` to `int64` or `float64`.

```quiz
type: spotline
question: Which line does not compile?
code: |
  var i int = 42
  var f float64 = i
  var g float64 = float64(i)
answer: 2
explain: "Assigning an `int` to a `float64` variable needs an explicit conversion: `float64(i)`. Line 3 shows the fix."
```

## Type inference

When the right-hand side is typed, the new variable gets that type. When it is an untyped
constant, the constant's *default type* is used: `int`, `float64`, `complex128`, `rune`,
`string`, or `bool`.

```go
v := 42           // int
w := 3.14         // float64
x := 0.5 + 2i     // complex128
r := 'a'          // rune (int32)
```

```quiz
type: predict
code: |
  x := 7 / 2
  y := 7.0 / 2
  fmt.Println(x, y)
options: ["3.5 3.5", "3 3.5", "3 3"]
answer: 1
explain: "`7 / 2` is integer division (both operands are untyped integer constants, so the result is an `int`): 3. `7.0 / 2` involves a float constant, so the result is `float64`: 3.5."
```

```quiz
type: mcq
question: What is `len("世界")`?
options: ["2", "6", "4"]
answer: 1
explain: "`len` on a string counts **bytes**. Each of these characters is 3 bytes in UTF-8, so 6. Use `utf8.RuneCountInString` (or `len([]rune(s))`) for the number of characters."
```

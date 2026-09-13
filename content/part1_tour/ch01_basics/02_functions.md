# 1.2 Functions & multiple results

Functions take zero or more typed arguments. The **type comes after the name** — Go reads
left to right: "`x` of type `int`".

```annotate
code: |
  func add(x int, y int) int {
      return x + y
  }

  func swap(x, y string) (string, string) {
      return y, x
  }

  func split(sum int) (x, y int) {
      x = sum * 4 / 9
      y = sum - x
      return
  }
hotspots:
  - { line: 1, match: "x int, y int", title: "Name, then type", note: "Parameter names first, types second. The result type follows the parameter list.", link: "https://go.dev/tour/basics/4" }
  - { line: 5, match: "x, y string", title: "Shared type", note: "When consecutive parameters share a type, write it once at the end of the group." }
  - { line: 5, match: "(string, string)", title: "Multiple results", note: "A function can return any number of values. The idiomatic use is `(value, error)`; you will see it everywhere.", link: "https://go.dev/tour/basics/6" }
  - { line: 9, match: "(x, y int)", title: "Named results", note: "Result values can be named. They are declared at the top of the function and start at their **zero value**.", link: "https://go.dev/tour/basics/7" }
  - { line: 12, match: "return", title: "Naked return", note: "A bare `return` returns the current values of the named results. Fine in short functions; in long ones it hurts readability." }
```

## Trace a call

```trace
code: |
  func split(sum int) (x, y int) {
      x = sum * 4 / 9
      y = sum - x
      return
  }

  func main() {
      fmt.Println(split(17))
  }
steps:
  - { line: 8, note: "main calls split(17). Println will receive both results.", vars: {} }
  - { line: 1, note: "sum is 17. Named results x and y start at their zero value, 0.", vars: { sum: "17", x: "0", y: "0" } }
  - { line: 2, note: "17 * 4 = 68, and 68 / 9 = 7 — integer division truncates toward zero.", vars: { sum: "17", x: "7", y: "0" } }
  - { line: 3, note: "y = 17 - 7.", vars: { sum: "17", x: "7", y: "10" } }
  - { line: 4, note: "Naked return hands back x and y as they are now.", vars: { sum: "17", x: "7", y: "10" } }
  - { line: 8, note: "Println prints both values separated by a space.", vars: {}, out: "7 10\n" }
```

## Using multiple results

```go
a, b := swap("hello", "world")   // a = "world", b = "hello"
_, b = swap("x", "y")            // discard a result with the blank identifier
```

Every returned value must be used or explicitly discarded with `_`; ignoring a result by
calling `swap(a, b)` alone is allowed, but ignoring an **error** that way is a bug waiting
to happen.

```quiz
type: predict
code: |
  func f() (a, b int) {
      a = 1
      return 2, 3
  }

  func main() {
      fmt.Println(f())
  }
options: ["1 3", "2 3", "0 0"]
answer: 1
explain: "An explicit `return 2, 3` assigns 2 to a and 3 to b before returning; the earlier `a = 1` is overwritten."
```

```quiz
type: mcq
question: Which signature is valid Go?
options: ["func f(int x, int y) int", "func f(x, y int) int", "func f(x int, y int) -> int"]
answer: 1
explain: "Types follow names, and there is no arrow: `func f(x, y int) int`."
```

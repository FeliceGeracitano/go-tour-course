# 0.3 How to use this course

Nothing here runs Go for you — you learn by **reading, clicking, and predicting**. Each
lesson mixes prose with four kinds of interactive blocks. Try each one below.

## 1. Annotated code

Highlighted tokens are clickable. Press **n** (or the button) to walk through them.

```annotate
code: |
  s := []int{1, 2, 3}
  for i, v := range s {
      fmt.Println(i, v)
  }
hotspots:
  - { line: 1, match: ":=", title: "Short declaration", note: "Declares `s` and infers its type from the right-hand side." }
  - { line: 2, match: "range", title: "range", note: "Iterates a slice yielding **index and value**. Drop either with `_`." }
```

## 2. Step-through traces

Use **← →** or the buttons. Watch the variables, output, and (later) goroutines and channels change.

```trace
code: |
  x := 1
  x = x * 2
  fmt.Println(x)
steps:
  - { line: 1, note: "Declare x and initialise it to 1.", vars: { x: "1" } }
  - { line: 2, note: "Read x, double it, store the result back into x.", vars: { x: "2" } }
  - { line: 3, note: "Print the current value of x.", vars: { x: "2" }, out: "2\n" }
```

## 3. Quizzes

Pick an answer; you get instant feedback and an explanation. Results are saved **in your
browser only** (nothing leaves your machine). "Try again" lets you retry.

```quiz
type: predict
code: |
  x := 1
  x = x * 2
  fmt.Println(x)
options: ["1", "2", "12"]
answer: 1
explain: "This is the trace above: x starts at 1, becomes 2, and Println prints 2."
```

## 4. Diagrams

Animated pictures for the ideas that are hard to see in text. Here is a preview of one you
will meet in **3.4 Slices**:

```diagram
id: slices-backing-array
```

## Progress

Use **Mark complete** at the bottom of a lesson; the sidebar ring fills up per chapter.
Every lesson ends with a **Reference** link to the official page it was written from —
read both.

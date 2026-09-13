# 6.6 Worked example: equivalent binary trees

Two binary search trees can have different shapes but the same sorted sequence of
values. An in-order traversal visits left subtree, node, then right subtree. Comparing
those sequences checks values and multiplicity without requiring matching shapes.

The Tour exercise combines recursion and channels. A complete solution also needs to
stop traversal goroutines if a mismatch makes the comparison return early.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "fmt"
  )

  type Tree struct { Value int; Left, Right *Tree }
  func walk(ctx context.Context, t *Tree, out chan<- int) bool {
      if t == nil { return true }
      if !walk(ctx, t.Left, out) { return false }
      select {
      case out <- t.Value:
      case <-ctx.Done(): return false
      }
      return walk(ctx, t.Right, out)
  }
  func stream(ctx context.Context, t *Tree) <-chan int {
      out := make(chan int)
      go func() { defer close(out); walk(ctx, t, out) }()
      return out
  }
  func Same(a, b *Tree) bool {
      ctx, cancel := context.WithCancel(context.Background())
      defer cancel()
      x, y := stream(ctx, a), stream(ctx, b)
      for {
          vx, okx := <-x
          vy, oky := <-y
          if okx != oky || vx != vy { return false }
          if !okx { return true }
      }
  }

  func main() {
      a := &Tree{Value: 2, Left: &Tree{Value: 1}, Right: &Tree{Value: 3}}
      b := &Tree{Value: 1, Right: &Tree{Value: 2, Right: &Tree{Value: 3}}}
      fmt.Println(Same(a, b))
      b.Right.Right.Value = 4
      fmt.Println(Same(a, b))
  }

  // Output:
  // true
  // false
hotspots: [{"line": 11, "match": "if !walk(ctx, t.Left, out)", "title": "Traverse in order", "note": "Finish the left subtree before emitting the current node."}, {"line": 14, "match": "case <-ctx.Done():", "title": "Let blocked sends stop", "note": "A mismatch can end comparison while a producer is waiting to send."}, {"line": 30, "match": "if okx != oky", "title": "Compare lengths as well as values", "note": "One stream ending before the other means the trees differ."}]
```

## Reason about both outcomes

The example uses its own Tree type, so it is self-contained. For binary search trees,
in-order traversal produces sorted values. For arbitrary trees, matching traversals
means only matching traversal sequences; it is not a general multiset comparison.

The stream helper owns its output channel and closes it after traversal returns.
Same cancels both producers on every exit path. Cancellation releases a traversal
blocked on a send after an early mismatch, instead of leaving a leaked goroutine.
The function does not wait for producer teardown; add explicit joining if a caller
needs resources to be released before Same returns.

Two empty trees compare equal. A proper prefix does not: the receive-ok flags detect
unequal lengths. Trees must remain unchanged during traversal, and must be finite and
acyclic. Deeply skewed trees also make recursion deep. For a purely synchronous caller,
an iterator or explicit stack may be simpler; channels here illustrate stream composition.

## Check your understanding

```quiz
type: "mcq"
question: "Why compare okx and oky, not just the received integers?"
options: ["Closed channels return random numbers", "Different-length streams can have equal zero-valued receives", "Tree values must be positive"]
answer: 1
explain: "A drained channel returns zero with ok false. The flag distinguishes stream completion from an actual zero value."
```

```quiz
type: "mcq"
question: "What can happen if Same returns on a mismatch without cancellation?"
options: ["A traversal goroutine can stay blocked sending", "The trees become sorted automatically", "All channels close themselves"]
answer: 0
explain: "The receiver has stopped, so an unbuffered producer needs a cancellation path to exit."
```

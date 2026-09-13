# 6.1 Goroutines

A goroutine is an independently scheduled function execution. Prefix a call with `go`
to start it and continue the caller. Goroutines make concurrent work convenient, but
starting work is only half the design: decide how it stops and how the caller waits.

Concurrency means activities can make progress independently. It does not promise a
particular execution order or that they run on different CPU cores.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      done := make(chan struct{})
      go func() {
          fmt.Println("worker finished")
          close(done)
      }()
      <-done
      fmt.Println("main finished")
  }

  // Output:
  // worker finished
  // main finished
hotspots: [{"line": 9, "match": "go func()", "title": "Start concurrent work", "note": "The function runs independently; main continues after launching it."}, {"line": 11, "match": "close(done)", "title": "Signal completion", "note": "The worker owns this completion channel and closes it after its work."}, {"line": 13, "match": "<-done", "title": "Wait explicitly", "note": "Receiving after close allows main to continue. This orders the two printed lines."}]
```

## Lifetime is part of correctness

When main returns, the process exits without waiting for other goroutines. Sleeping
for an estimated duration is not a reliable substitute for waiting on a channel or a
WaitGroup. A slow machine or different schedule can expose the mistake.

Arguments to a go call are evaluated in the caller before the goroutine starts. Passing
an explicit argument can make ownership clearer than capturing a variable which later
changes. Modern loop-variable rules help in many cases, but they do not make arbitrary
shared variables safe.

Two goroutines accessing the same variable, with at least one write and no appropriate
synchronization, can create a data race. Use channels, mutexes, or another documented
coordination mechanism. Run representative tests with `go test -race`; it detects races
on executed paths, not every possible execution. Also bound concurrent work: cheap
goroutines still consume memory and can overwhelm downstream resources.

## Check your understanding

```quiz
type: "mcq"
question: "What guarantees that worker finished prints before main finished?"
options: ["The worker probably runs first", "The completion channel receive", "The go keyword alone"]
answer: 1
explain: "The worker prints before closing done; main prints only after observing that completion."
```

```quiz
type: "mcq"
question: "What happens to unfinished goroutines when main returns?"
options: ["The runtime waits for all of them", "The process exits", "They continue as background processes"]
answer: 1
explain: "Programs must explicitly wait for work that must finish."
```

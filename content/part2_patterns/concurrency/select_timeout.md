# select with timeout

A timeout bounds how long a caller waits. Select between the operation's result and a
timer, but distinguish “stop waiting” from “stop the underlying work.” A timer alone
cannot interrupt a database call or a goroutine blocked elsewhere.

For a one-off wait, an explicit Timer makes its lifetime visible and can be stopped
when the result wins.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "time"
  )

  func main() {
      result := make(chan string, 1)
      result <- "cached"
      timer := time.NewTimer(time.Hour)
      defer timer.Stop()
      select {
      case value := <-result:
          fmt.Println(value)
      case <-timer.C:
          fmt.Println("timed out")
      }
  }

  // Output:
  // cached
hotspots: [{"line": 9, "match": "make(chan string, 1)", "title": "One-result delivery", "note": "A bounded one-result worker could send here even if the caller stopped waiting."}, {"line": 11, "match": "time.NewTimer", "title": "One timed event", "note": "A Timer fires once; a Ticker is for repeated events."}, {"line": 12, "match": "defer timer.Stop()", "title": "Release timer activity", "note": "When the result wins, the unused timer no longer needs to fire."}]
```

## Timeout the operation too

When an API accepts context, use context.WithTimeout and pass the resulting context to
the operation. The API must cooperate with cancellation. A caller abandoning a result
channel does not magically cancel I/O or close the worker's resources.

A buffer of one is sufficient only for a protocol that sends at most one result. It is
not a general fix for a producer streaming arbitrary values. For streams, add a
cancellation-aware send or keep draining until the producer finishes.

Avoid creating a new timeout every loop iteration if you intend one overall deadline:
that can keep resetting the budget. Create the timer outside the loop or derive one
context deadline for the whole operation. If both result and timeout are ready, select
can choose either; it does not promise a strict “result always wins” policy.

## Check your understanding

```quiz
type: "mcq"
question: "The timer case wins. Has the underlying work necessarily stopped?"
options: ["Yes", "No, it needs its own cancellation support", "Only if the timer duration is short"]
answer: 1
explain: "Timeout controls the waiting code. The operation must cooperate to stop."
```

```quiz
type: "mcq"
question: "Where should a timer live for one total budget across a receive loop?"
options: ["Outside the loop", "Recreated before every receive", "Inside the default case"]
answer: 0
explain: "Recreating a timer per iteration measures separate waits instead of one overall deadline."
```

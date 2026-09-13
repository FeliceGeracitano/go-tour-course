# 6.4 select & default

A `select` waits on channel operations. If one case can proceed, that case runs. If
several are ready, one is chosen pseudo-randomly; source order is not a priority rule.

A default case makes the operation nonblocking: it runs when no communication case
can proceed. Without default, select waits until something becomes ready.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      ch := make(chan string, 1)
      select {
      case value := <-ch:
          fmt.Println(value)
      default:
          fmt.Println("empty")
      }
      ch <- "ready"
      select {
      case value := <-ch:
          fmt.Println(value)
      default:
          fmt.Println("empty")
      }
  }

  // Output:
  // empty
  // ready
hotspots: [{"line": 10, "match": "case value := <-ch:", "title": "Communication case", "note": "This branch is available only when receiving can proceed."}, {"line": 12, "match": "default:", "title": "Do not wait", "note": "The first select finds no value and uses this branch."}, {"line": 15, "match": "ch <- \"ready\"", "title": "Make receiving ready", "note": "The second select receives the queued value, so default does not run."}]
```

## Avoid accidental spinning

`for { select { default: ... } }` can spin continuously and waste a CPU when no work is
ready. Omit default when waiting is appropriate. Use a timer or ticker when the program
really needs a timed event rather than repeated polling.

A nil channel disables its select case because communication on it cannot proceed.
This is useful when merging a fixed number of streams: set a finished input to nil.
A closed channel remains ready forever, so forgetting to disable it can create a busy
loop receiving zero values. Check the receive's ok result.

Cancellation is often another select case, such as `<-ctx.Done()`. If work and
cancellation are both ready, either may win. Do not promise strict cancellation priority
based on placing the case first. All select channel operands and send values are
evaluated on entry, even for cases that are not selected; avoid surprising side effects.

## Check your understanding

```quiz
type: "mcq"
question: "Two receive cases are ready. Which runs?"
options: ["The first case in source order", "One ready case is chosen pseudo-randomly", "Both run"]
answer: 1
explain: "Select does not establish priority among ready communication cases."
```

```quiz
type: "mcq"
question: "How can a finished input case be disabled in a loop?"
options: ["Keep receiving its zero values", "Set that channel variable to nil", "Add more default cases"]
answer: 1
explain: "Communication on a nil channel cannot proceed, so its case is disabled."
```

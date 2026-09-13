# 6.3 range & close

A sender can close a channel to announce that no more values will arrive. Closing does
not discard buffered values. Receivers can drain them and then detect the end of the
stream.

`for value := range ch` receives until the channel is closed and drained. It does not
stop merely because the channel is temporarily empty.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      ch := make(chan int, 2)
      ch <- 3
      ch <- 5
      close(ch)
      for value := range ch {
          fmt.Println(value)
      }
      value, ok := <-ch
      fmt.Println(value, ok)
  }

  // Output:
  // 3
  // 5
  // 0 false
hotspots: [{"line": 11, "match": "close(ch)", "title": "Producer announces completion", "note": "All sends in this example are finished before the close."}, {"line": 12, "match": "range ch", "title": "Drain the stream", "note": "This receives 3 and 5, then stops after observing closure."}, {"line": 15, "match": "value, ok := <-ch", "title": "Distinguish end from zero", "note": "ok is false only when the channel is closed and no buffered value remains."}]
```

## Who should close?

Usually the sender owns closing, because it knows when sending is finished. A receiver
that closes while a sender is still active can cause a panic. With several senders, use
a coordinator that waits for all senders before closing the shared output channel.
Never close it independently in every producer.

Channels do not have to be closed for garbage collection. Close when receivers need an
end-of-stream signal. A one-value exchange may have a different completion protocol.
Closing a nil channel or closing an already closed channel panics.

If a receiver stops early, the sender may remain blocked on its next send. Arrange
cancellation, drain the channel, or use a bounded protocol that guarantees the send can
finish. A buffer only postpones the problem when producers can send an unbounded number
of values. The patterns section develops cancellation-aware pipelines.

## Check your understanding

```quiz
type: "predict"
code: |
  ch := make(chan int, 1)
  ch <- 0
  close(ch)
  a, first := <-ch
  b, second := <-ch
  fmt.Println(a, first, b, second)
options: ["0 true 0 false", "0 false 0 false", "Panic"]
answer: 0
explain: "The stored zero is a real value with ok true. Only the drained closed channel yields ok false."
```

```quiz
type: "mcq"
question: "When does range over a channel end?"
options: ["When the buffer is momentarily empty", "When the channel is closed and drained", "After one value"]
answer: 1
explain: "An empty but open channel makes the receiver wait for more data."
```

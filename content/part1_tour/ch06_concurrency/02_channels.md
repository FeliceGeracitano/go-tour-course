# 6.2 Channels & buffered channels

A channel transfers typed values between goroutines and can coordinate their execution.
`make(chan int)` creates an unbuffered channel; `make(chan int, 2)` creates a channel with
two buffer slots.

An unbuffered send waits for a receiver. A buffered send can proceed while space is
available, and a receive waits when there is no value available on an open channel.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  func main() {
      jobs := make(chan int, 2)
      jobs <- 4
      jobs <- 7
      fmt.Println(<-jobs)
      fmt.Println(<-jobs)
  }

  // Output:
  // 4
  // 7
hotspots: [{"line": 8, "match": "make(chan int, 2)", "title": "Two available slots", "note": "The first two sends fit without another goroutine receiving."}, {"line": 9, "match": "jobs <- 4", "title": "Send a value", "note": "The arrow points into the channel."}, {"line": 11, "match": "<-jobs", "title": "Receive a value", "note": "The arrow before a channel expression takes the next value."}]
```

## Backpressure and ownership

A bounded buffer can absorb short bursts. Once it fills, senders wait; this is
backpressure, not a reason to make buffers arbitrarily large. Choose capacity from the
workload and memory budget. `len(ch)` is a momentary count, not a safe precondition for
a later send or receive in concurrent code.

Channel direction can narrow an API. `chan<- int` permits sending and `<-chan int`
permits receiving. A function returning a receive-only channel makes the caller's role
clearer. Direction does not by itself say who is responsible for closing the channel.

A nil channel blocks forever on send and receive. A closed channel behaves differently:
receivers drain buffered values and then receive zero values with ok false. Sending to
a closed channel panics. Sending pointers or slices shares access to underlying data;
the channel does not deep-copy it or prevent later unsynchronized mutations.

```trace
code: |
  ch := make(chan int, 2)
  ch <- 4
  ch <- 7
  fmt.Println(<-ch)
  fmt.Println(<-ch)
steps: [{"line": 1, "note": "Allocate two empty slots.", "goroutines": ["main"], "channels": {"ch": {"buf": [], "cap": 2}}}, {"line": 2, "note": "The first send occupies one slot.", "channels": {"ch": {"buf": ["4"], "cap": 2}}}, {"line": 3, "note": "The second send fills the buffer.", "channels": {"ch": {"buf": ["4", "7"], "cap": 2}}}, {"line": 4, "note": "Receive the oldest buffered value.", "channels": {"ch": {"buf": ["7"], "cap": 2}}, "out": "4\n"}, {"line": 5, "note": "Receive the remaining value.", "channels": {"ch": {"buf": [], "cap": 2}}, "out": "7\n"}]
```

## Check your understanding

```quiz
type: "predict"
code: |
  ch := make(chan int, 2)
  ch <- 3
  ch <- 8
  fmt.Println(<-ch, <-ch)
options: ["3 8", "8 3", "Either order"]
answer: 0
explain: "Values sent sequentially on one channel are received in that order."
```

```quiz
type: "mcq"
question: "A buffered channel is full and nobody receives. What does another send do?"
options: ["Drops the value", "Blocks", "Overwrites the oldest value"]
answer: 1
explain: "A send waits until buffer space becomes available, unless a surrounding select chooses another ready case."
```

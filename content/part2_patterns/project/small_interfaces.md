# Small, consumer-side interfaces

Define an interface around the behavior a consumer actually needs. A receipt renderer
may need one Write method; it does not need the full API of a file, socket, or buffer.
Small interfaces reduce coupling and make substitutes easy to test.

The consumer should generally choose the contract. A concrete implementation does not
need to predict every future consumer by exporting a giant interface.

## Read the example

```annotate
code: |
  package main

  import (
      "bytes"
      "fmt"
      "io"
  )

  func receipt(w io.Writer, item string) error {
      _, err := fmt.Fprintf(w, "item: %s\n", item)
      return err
  }

  func main() {
      var b bytes.Buffer
      if err := receipt(&b, "tea"); err != nil { panic(err) }
      fmt.Print(b.String())
  }

  // Output:
  // item: tea
hotspots: [{"line": 9, "match": "w io.Writer", "title": "Depend on the needed capability", "note": "Any implementation of Write([]byte) (int, error) can be used."}, {"line": 11, "match": "return err", "title": "Honor the capability’s failure contract", "note": "Writing can fail even when formatting the text succeeds."}, {"line": 16, "match": "receipt(&b", "title": "Concrete substitute", "note": "bytes.Buffer satisfies io.Writer without a special test framework."}]
```

## Narrow behavior, complete semantics

Reusing a standard interface such as io.Writer is better than inventing an identical
local one. Define your own small interface when the domain needs a behavior not already
captured by a standard contract, for example `FindProduct(ctx, id)`.

A small interface still needs semantics: does the consumer borrow or own the dependency,
can calls be concurrent, what does absence mean, and how are errors classified? receipt
borrows its writer and does not close it. That makes files, buffers, and caller-managed
streams equally usable.

Return concrete types when callers benefit from their complete API, and accept interfaces
where substitution is useful. Avoid adding interfaces to every constructor merely for
mocking. A real in-memory implementation can be clearer than a mock that duplicates
internal call order. Test observable behavior and failures at the boundary.

## Check your understanding

```quiz
type: "mcq"
question: "Why accept io.Writer rather than *os.File for receipt?"
options: ["It exposes only the needed writing behavior and admits other implementations", "It makes writes infallible", "It automatically closes the file"]
answer: 0
explain: "The consumer does not require file-specific behavior."
```

```quiz
type: "mcq"
question: "Should receipt close the provided writer?"
options: ["Always", "Not under this borrowing contract", "Only for bytes.Buffer"]
answer: 1
explain: "Ownership of lifetime stays with the caller, and io.Writer does not require Close."
```

# Reading files with bufio

Use bufio.Scanner for line-oriented text when loading the whole input would be
wasteful. It reads incrementally and separates tokenization from the source of bytes.
The same helper can accept a file or a string through io.Reader.

Always check Scanner.Err after the loop. A false Scan result means either end of input
or a scanning failure, including an oversized token.

## Read the example

```annotate
code: |
  package main

  import (
      "bufio"
      "fmt"
      "io"
      "strings"
  )

  func lines(r io.Reader) error {
      scanner := bufio.NewScanner(r)
      scanner.Buffer(make([]byte, 4096), 1024*1024)
      for scanner.Scan() { fmt.Println(scanner.Text()) }
      return scanner.Err()
  }

  func main() {
      if err := lines(strings.NewReader("tea\ncoffee\n")); err != nil { panic(err) }
  }

  // Output:
  // tea
  // coffee
hotspots: [{"line": 12, "match": "scanner.Buffer", "title": "Bound token size explicitly", "note": "The maximum here is about 1 MiB. Configure Buffer before the first Scan."}, {"line": 13, "match": "scanner.Text()", "title": "Current token as a string", "note": "The default split function removes line endings."}, {"line": 14, "match": "return scanner.Err()", "title": "Do not confuse failure with EOF", "note": "An oversized line or an underlying read failure must reach the caller."}]
```

## Open a file at the boundary

To read a file, use `f, err := os.Open(path)`, handle the error, then `defer f.Close()`
and call `lines(f)`. The helper borrows the reader; the caller that opened the file owns
closing it. Passing io.Reader makes the line-handling logic easy to test without a disk.

Scanner has a bounded maximum token size. Raising the limit is appropriate when large
lines are expected, but unbounded memory use is not a solution to arbitrary input.
Use bufio.Reader when the protocol needs more control over long records or delimiters.

Scanner.Bytes returns storage that may be overwritten by the next Scan. Copy it before
retaining it. Scanner.Text returns a string suitable for keeping beyond the current
iteration. Neither line scanning nor a larger buffer validates encoding, record fields,
or domain constraints; apply those checks after reading each record.

## Check your understanding

```quiz
type: "mcq"
question: "Scan returns false. How do you distinguish EOF from a read failure?"
options: ["Inspect Scanner.Err()", "Assume EOF", "Call Scan until it returns true"]
answer: 0
explain: "Err reports scanning errors; ordinary EOF is not returned as an error."
```

```quiz
type: "mcq"
question: "Can Scanner.Bytes be retained unchanged across the next Scan?"
options: ["Always", "Not without copying if it must remain stable", "Only on empty lines"]
answer: 1
explain: "The scanner can reuse its backing storage for the next token."
```

## Further reading

[Scanner contract](https://pkg.go.dev/bufio#Scanner)

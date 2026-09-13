# 4.6 Standard interfaces: io.Reader, image.Image

Small standard interfaces let unrelated implementations work with the same code.
`io.Reader` supplies bytes, whether they come from a string, file, socket, or decompressor.
`image.Image` supplies a color model, bounds, and pixels.

Learn the contract as well as the method names: an interface's signatures alone cannot
explain how to interpret partial reads or image coordinates.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "io"
      "strings"
      "image"
  )

  func main() {
      var r io.Reader = strings.NewReader("Go!")
      buf := make([]byte, 2)
      for {
          n, err := r.Read(buf)
          if n > 0 { fmt.Printf("%s", buf[:n]) }
          if err == io.EOF { break }
          if err != nil { panic(err) }
      }
      fmt.Println()
      var img image.Image = image.NewRGBA(image.Rect(10, 20, 12, 23))
      fmt.Println(img.Bounds().Dx(), img.Bounds().Dy())
  }

  // Output:
  // Go!
  // 2 3
hotspots: [{"line": 15, "match": "buf[:n]", "title": "Process only bytes read", "note": "The rest of the buffer can contain bytes from an earlier read."}, {"line": 16, "match": "if err == io.EOF", "title": "Check after processing n bytes", "note": "A Reader may return both data and an error in the same call."}, {"line": 20, "match": "image.Rect(10, 20, 12, 23)", "title": "Bounds need not start at zero", "note": "The rectangle has an inclusive minimum and exclusive maximum."}]
```

## Read and draw through contracts

A Reader has `Read(p []byte) (n int, err error)`. It can return fewer bytes than the
buffer length without being finished. Process `p[:n]` before handling an error, and use
`io.ReadFull` when a protocol needs an exact number of bytes. `io.Copy` handles ordinary
copy loops between a Reader and Writer, and reports transferred bytes and errors.

An Image has `ColorModel() color.Model`, `Bounds() image.Rectangle`, and
`At(x, y int) color.Color`. Iterate from `bounds.Min` to strictly before `bounds.Max`.
An implementation may describe a subimage with a nonzero origin; assuming `(0, 0)` loses
that information. Width and height are `Dx()` and `Dy()`.

Prefer these contracts in function parameters where their behavior is sufficient.
A function accepting io.Reader can be tested with strings.NewReader without creating
files. It should not close the reader unless ownership and closing are explicitly part
of its API; io.Reader itself has no Close method.

## Check your understanding

```quiz
type: "mcq"
question: "Read returns n = 3 and io.EOF together. What should the caller do?"
options: ["Discard the three bytes", "Process the three bytes, then finish", "Read the entire buffer capacity"]
answer: 1
explain: "The returned bytes are valid even when the same call signals EOF."
```

```quiz
type: "mcq"
question: "For image.Rect(10, 20, 12, 23), what is the width?"
options: ["12", "10", "2"]
answer: 2
explain: "Width is Max.X minus Min.X; image bounds can begin away from zero."
```

## Further reading

[io.Reader contract](https://pkg.go.dev/io#Reader)

[image.Image contract](https://pkg.go.dev/image#Image)

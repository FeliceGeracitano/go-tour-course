# Strings, runes, strings.Builder

A Go string is an immutable sequence of bytes. It often contains UTF-8, but arbitrary
bytes are permitted. `len(s)` counts bytes; ranging over a string decodes runes, which
represent Unicode code points.

Neither a byte nor a rune necessarily corresponds to one character a reader perceives.
Combining marks and emoji sequences can contain several code points.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "strings"
      "unicode/utf8"
  )

  func main() {
      s := "café"
      fmt.Println(len(s), utf8.RuneCountInString(s))
      for i, r := range s { if i > 0 { fmt.Print(" ") }; fmt.Printf("%d:%c", i, r) }
      fmt.Println()
      var b strings.Builder
      b.WriteString("hello")
      b.WriteByte(' ')
      b.WriteString("Go")
      fmt.Println(b.String())
  }

  // Output:
  // 5 4
  // 0:c 1:a 2:f 3:é
  // hello Go
hotspots: [{"line": 11, "match": "len(s)", "title": "Byte count", "note": "é occupies two UTF-8 bytes here, so the four-rune string uses five bytes."}, {"line": 12, "match": "for i, r := range s", "title": "Decode runes", "note": "i is the starting byte offset, not a rune counter."}, {"line": 14, "match": "strings.Builder", "title": "Accumulate text", "note": "Append pieces without repeatedly rebuilding a growing string."}]
```

## Choose the unit deliberately

Indexing `s[i]` returns a byte. Slicing by arbitrary byte indexes can cut a UTF-8 encoding
in half. Convert to `[]rune` for simple code-point indexing, accepting an allocation and
still not claiming user-perceived character indexing. A range loop over invalid UTF-8
emits RuneError and advances according to the decoder's rules.

`strings.Builder` has a usable zero value. Use Grow when a reasonable size estimate is
known, write pieces, then call String. Do not copy a nonzero Builder; pass a pointer if
it needs to be shared with helper functions. Use bytes.Buffer when a mutable byte-oriented
buffer with Reader/Writer behavior is more suitable.

For equality or searching, decide whether raw byte equality is the right contract.
Visually identical text can use different Unicode normalization forms. Case conversion,
normalization, and grapheme segmentation are separate concerns; counting runes alone
does not solve them.

## Check your understanding

```quiz
type: "predict"
code: |
  s := "é"
  fmt.Println(len(s), len([]rune(s)))
options: ["1 1", "2 1", "2 2"]
answer: 1
explain: "This character uses two UTF-8 bytes and one code point."
```

```quiz
type: "mcq"
question: "What does the index from range over a string represent?"
options: ["The byte offset of the decoded rune", "Always the rune’s ordinal position", "A pointer to the character"]
answer: 0
explain: "Offsets refer to the original string’s bytes, so they can jump by more than one."
```

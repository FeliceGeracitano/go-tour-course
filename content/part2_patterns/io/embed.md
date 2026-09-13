# //go:embed

`//go:embed` includes files in a binary at build time. Use it for templates, static
assets, or small default data that should travel with the application. Changing an
embedded source file requires rebuilding the binary.

Create `assets/message.txt` beside your package directory with the contents `hello Go`
followed by a newline. Then put the following program in main.go in that package.

## Read the example

```annotate
code: |
  package main

  import (
      "embed"
      "fmt"
  )

  //go:embed assets/message.txt
  var assets embed.FS

  func main() {
      data, err := assets.ReadFile("assets/message.txt")
      if err != nil { panic(err) }
      fmt.Print(string(data))
  }
hotspots: [{"line": 8, "match": "//go:embed", "title": "Build directive", "note": "The directive belongs immediately before the package-level variable declaration."}, {"line": 9, "match": "embed.FS", "title": "Read-only file tree", "note": "An FS can hold multiple files and implements fs.FS."}, {"line": 12, "match": "assets.ReadFile", "title": "Paths inside the embedded tree", "note": "Use slash-separated paths relative to the embedding package."}]
```

## Build-time inputs are part of the program

For one file you can embed directly into a string or []byte. Those forms still require
importing embed, often as `_ "embed"` when the package name is otherwise unused. An
embed.FS is suitable for multiple paths and can be passed to helpers that accept fs.FS.

Patterns are resolved relative to the package directory. They cannot escape with `..`
or select arbitrary files outside the module. Patterns must match valid files at build
time. Directory matching normally excludes names beginning with a dot or underscore;
read the embed documentation before using an `all:` pattern deliberately.

Embedded bytes are included in the executable, so do not embed passwords or private
keys. The filesystem is read-only; keep mutable user data in runtime storage. Embedding
large files increases binary size and deployment costs. For HTTP assets, combine http.FS
and a suitable fs.Sub when you want to serve a subtree without its directory prefix.

## Check your understanding

```quiz
type: "mcq"
question: "Editing assets/message.txt after building changes the running binary’s contents…"
options: ["Immediately", "Only after rebuilding and restarting with the new binary", "When ReadFile is next called"]
answer: 1
explain: "Embedding copies build-time inputs into the executable."
```

```quiz
type: "mcq"
question: "Can //go:embed ../secrets.txt read a parent directory?"
options: ["Yes", "No, parent traversal is not permitted", "Only in main packages"]
answer: 1
explain: "Embed patterns are constrained to valid package-relative paths."
```

## Further reading

[embed package and pattern rules](https://pkg.go.dev/embed)

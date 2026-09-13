# Writing files atomically

For a replacement file, write a temporary file in the destination directory, finish
and close it, then rename it over the target. On filesystems and platforms supporting
atomic replacement, readers see the old file or the completed new file.

Atomic visibility is different from crash durability. This pattern needs platform and
filesystem guarantees; Go does not promise atomic Rename on every operating system.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
      "os"
      "path/filepath"
  )

  func replace(path string, data []byte) error {
      f, err := os.CreateTemp(filepath.Dir(path), ".replace-*")
      if err != nil { return err }
      defer os.Remove(f.Name())
      defer f.Close()
      if _, err := f.Write(data); err != nil { return err }
      if err := f.Sync(); err != nil { return err }
      if err := f.Close(); err != nil { return err }
      return os.Rename(f.Name(), path)
  }

  func main() {
      dir, err := os.MkdirTemp("", "course-config-")
      if err != nil { panic(err) }
      defer os.RemoveAll(dir)
      path := filepath.Join(dir, "config.json")
      if err := replace(path, []byte(`{"enabled":true}`)); err != nil { panic(err) }
      data, err := os.ReadFile(path)
      if err != nil { panic(err) }
      fmt.Println(string(data))
  }

  // Output:
  // {"enabled":true}
hotspots: [{"line": 10, "match": "filepath.Dir(path)", "title": "Same directory", "note": "This avoids a cross-filesystem rename and keeps replacement near the target."}, {"line": 15, "match": "f.Sync()", "title": "Flush file contents", "note": "This is part of durability handling, not a universal guarantee against all failures."}, {"line": 17, "match": "os.Rename(f.Name(), path)", "title": "Publish after writing", "note": "The destination is replaced only after writes and close have succeeded."}]
```

## State the guarantee precisely

CreateTemp uses restrictive permissions. If replacing an existing file, decide whether
to preserve its permissions and metadata; the example deliberately creates a private
new file. The deferred removal cleans up the temporary name on failures. After a
successful rename that old name is gone, so the cleanup is harmless.

On Unix-like filesystems, stronger crash durability may also require syncing the parent
directory after rename. Network filesystems and other platforms can have different
semantics. On non-Unix systems, even a rename within one directory is not guaranteed
atomic by os.Rename. Use a platform-appropriate library when you need a portable promise.

This is replacement, not concurrent-update coordination. Two writers can both succeed
and the last rename wins. Use locking, version checks, or a storage system with transactions
if updates must not overwrite each other. The sample deletes only its own temporary demo
directory when finished.

## Check your understanding

```quiz
type: "mcq"
question: "Why create the temporary file in the target directory?"
options: ["To avoid cross-filesystem rename", "To make all platforms atomic", "To skip checking Close errors"]
answer: 0
explain: "A rename across filesystems may fail; same-directory placement is part of the replacement protocol."
```

```quiz
type: "mcq"
question: "Does atomic replacement prevent two writers from losing each other’s updates?"
options: ["Yes", "No, concurrency control is a separate requirement", "Only for JSON"]
answer: 1
explain: "Atomic visibility does not provide compare-and-swap or transactional update semantics."
```

## Further reading

[os.Rename portability guarantees](https://pkg.go.dev/os#Rename)

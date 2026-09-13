# JSON tags & marshalling

`encoding/json` maps exported Go fields to JSON. Struct tags choose wire names and
omission rules, while the Go types express what values your application expects.
Unexported fields are ignored even if a JSON tag is present.

Treat encoding rules and validation as separate steps. Decoding a negative quantity
into an int succeeds syntactically even when the quantity is invalid for your domain.

## Read the example

```annotate
code: |
  package main

  import (
      "encoding/json"
      "fmt"
  )

  type Product struct {
      Name string `json:"name"`
      Stock int `json:"stock,omitempty"`
      Secret string `json:"-"`
  }

  func main() {
      p := Product{Name: "tea", Stock: 0}
      data, err := json.Marshal(p)
      if err != nil { panic(err) }
      fmt.Println(string(data))
      var decoded Product
      if err := json.Unmarshal(data, &decoded); err != nil { panic(err) }
      fmt.Println(decoded.Name, decoded.Stock)
  }

  // Output:
  // {"name":"tea"}
  // tea 0
hotspots: [{"line": 9, "match": "`json:\"name\"`", "title": "Wire name", "note": "The JSON key is name rather than the Go field name Name."}, {"line": 10, "match": "`json:\"stock,omitempty\"`", "title": "Omit empty values", "note": "A zero integer is omitted. Use a pointer when absent and explicit zero must be distinct."}, {"line": 20, "match": "json.Unmarshal(data, &decoded)", "title": "Writable destination", "note": "Pass a pointer so decoding can populate the struct."}]
```

## Preserve the distinctions your API needs

A `*int` field can represent an omitted quantity with nil and an explicit zero with a
non-nil pointer. Plain int cannot distinguish them after decoding. Nil slices normally
encode as null, whereas non-nil empty slices encode as an empty JSON array.

Decoding into `any` uses float64 for ordinary JSON numbers, which can lose precision for
large integers. Prefer typed fields or a Decoder with UseNumber when the shape is truly
dynamic. Marshal and Unmarshal can fail, so handle their errors.

A Decoder reads a stream, and one Decode call does not prove there is only one JSON
value in the body. At an HTTP boundary, enforce size limits, validate required fields,
and reject trailing values when the protocol expects exactly one object. The JSON API
lesson shows that complete request-handling sequence.

## Check your understanding

```quiz
type: "mcq"
question: "With stock,omitempty, what happens to an integer Stock of zero?"
options: ["It is encoded as null", "The field is omitted", "It becomes the string \"0\""]
answer: 1
explain: "omitempty treats a zero integer as empty. It does not mean only nil values are omitted."
```

```quiz
type: "mcq"
question: "What distinguishes missing quantity from an explicit zero most directly?"
options: ["A *int field", "An unexported int field", "Ignoring decode errors"]
answer: 0
explain: "Nil and a pointer to zero carry different presence information."
```

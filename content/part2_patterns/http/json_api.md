# JSON API handler

A JSON handler needs a bounded body, syntactic decoding, presence and value validation,
and a deliberate response. One successful Decode is not enough: a client can send a
second JSON value after the first.

This handler accepts exactly one object with a positive quantity. It uses a pointer
field to distinguish a missing quantity from an explicit zero.

## Read the example

```annotate
code: |
  package main

  import (
      "encoding/json"
      "errors"
      "fmt"
      "io"
      "mime"
      "net/http"
      "net/http/httptest"
      "strings"
  )

  func createOrder(w http.ResponseWriter, r *http.Request) {
      if r.Method != http.MethodPost {
          w.Header().Set("Allow", "POST")
          http.Error(w, "method not allowed", http.StatusMethodNotAllowed); return
      }
      media, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
      if err != nil || media != "application/json" {
          http.Error(w, "expected JSON", http.StatusUnsupportedMediaType); return
      }
      r.Body = http.MaxBytesReader(w, r.Body, 4096)
      defer r.Body.Close()
      dec := json.NewDecoder(r.Body)
      dec.DisallowUnknownFields()
      var input struct { Quantity *int `json:"quantity"` }
      if err := dec.Decode(&input); err != nil { badJSON(w, err); return }
      if err := dec.Decode(new(any)); err != io.EOF {
          badJSON(w, err); return
      }
      if input.Quantity == nil || *input.Quantity <= 0 {
          http.Error(w, "quantity must be positive", http.StatusBadRequest); return
      }
      body, err := json.Marshal(struct { Accepted int `json:"accepted"` }{*input.Quantity})
      if err != nil { http.Error(w, "encoding failed", 500); return }
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusCreated)
      _, _ = w.Write(body)
  }
  func badJSON(w http.ResponseWriter, err error) {
      var tooLarge *http.MaxBytesError
      if errors.As(err, &tooLarge) { http.Error(w, "body too large", 413); return }
      http.Error(w, "expected one valid JSON object", 400)
  }

  func main() {
      req := httptest.NewRequest("POST", "/orders", strings.NewReader(`{"quantity":2}`))
      req.Header.Set("Content-Type", "application/json")
      rr := httptest.NewRecorder()
      createOrder(rr, req)
      fmt.Println(rr.Code, strings.TrimSpace(rr.Body.String()))
  }

  // Output:
  // 201 {"accepted":2}
hotspots: [{"line": 23, "match": "http.MaxBytesReader", "title": "Bound resource use", "note": "Oversized reads produce a MaxBytesError, which the handler maps to status 413."}, {"line": 26, "match": "dec.DisallowUnknownFields()", "title": "Reject unexpected keys", "note": "This makes misspelled fields visible instead of silently ignoring them."}, {"line": 29, "match": "dec.Decode(new(any))", "title": "Reject trailing values", "note": "A second decode must report EOF. A nil error would mean another value was present."}]
```

## Validate before committing the response

The handler marshals the small response before writing status 201, so an encoding error
can still become a 500 response. Once headers or body bytes are sent, a later error cannot
retroactively change the status. The example explicitly ignores a final response write
error because the response is already committed; real services may log it.

DisallowUnknownFields is a schema choice, not complete JSON validation. Duplicate object
keys are still accepted by encoding/json, with later values able to replace or merge
earlier ones. Add a stricter decoder if your protocol must reject them. The quantity
pointer and validation also reject null or missing input for this operation.

Domain work such as reserving inventory belongs after validation and must have its own
error handling, cancellation, authorization, and transaction rules. Do not return internal
decoder or storage details directly to clients; use stable error messages and internal
logs where more diagnostic context is needed.

## Check your understanding

```quiz
type: "mcq"
question: "Why perform a second Decode and require io.EOF?"
options: ["To accept two orders at once", "To reject trailing JSON values", "To reset the body size limit"]
answer: 1
explain: "A single Decode can succeed while unread JSON remains in the stream."
```

```quiz
type: "mcq"
question: "Does DisallowUnknownFields reject duplicate keys?"
options: ["Yes", "No", "Only if a field is a pointer"]
answer: 1
explain: "It rejects unknown struct fields, not duplicate JSON keys."
```

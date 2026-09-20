# Struct embedding

Embedding gives a struct a field whose name comes from its type. Eligible fields and
methods of the embedded value are promoted, allowing shorter selectors. This is
composition with convenient access, not class inheritance.

Use embedding when the promoted behavior truly belongs in the outer type's API. Use a
named field when callers should go through an explicit boundary.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type Profile struct { Name string }
  func (p Profile) Label() string { return "user:" + p.Name }
  type User struct {
      Profile
      ID int
  }

  func main() {
      u := User{Profile: Profile{Name: "Ada"}, ID: 7}
      fmt.Println(u.Name, u.Label())
      u.Profile.Name = "Lin"
      fmt.Println(u.Name)
  }

  // Output:
  // Ada user:Ada
  // Lin
hotspots: [{"line": 10, "match": "    Profile", "title": "Embedded value", "note": "The field is named Profile, and its eligible members can be promoted."}, {"line": 15, "match": "Profile: Profile{Name:", "title": "Initialise the actual field", "note": "Naming the actual field works on every Go version. Go 1.27 additionally accepts promoted fields as keys, such as `User{Name: \"Ada\"}`; older language versions reject that."}, {"line": 16, "match": "u.Label()", "title": "Promoted method", "note": "This forwards to the embedded Profile method; it is not virtual dispatch."}]
```

## Promotion has consequences

A promoted method can make the outer type satisfy an interface, even if that was not
obvious at its declaration. Changes to an embedded public type can therefore change the
outer type's API. An explicit named field avoids that exposure.

If two embedded values contribute equally shallow methods with the same name, the
selector is ambiguous; choose an explicit path. A method on the outer type can hide a
promoted method, but a method executing on the inner value does not dynamically call
an outer replacement as a virtual base-class method would.

Embedding a pointer leaves that pointer nil in the outer type's zero value. Promoted
field access can then panic unless construction establishes the value first. Embedding
a value, as above, gives it its ordinary zero value. Consider the useful-zero-value
contract before choosing pointer embedding.

## Check your understanding

```quiz
type: "mcq"
question: "Which literal sets the embedded Profile's Name on every Go version since 1.18?"
options: ["User{Name: \"Ada\"}", "User{Profile: Profile{Name: \"Ada\"}}", "User{Profile.Name: \"Ada\"}"]
answer: 1
explain: "Naming the actual field works everywhere. Go 1.27 additionally accepts the promoted key User{Name: \"Ada\"}, but older language versions reject it, and a dotted key is never valid."
```

```quiz
type: "mcq"
question: "Does embedding implement class-style virtual inheritance?"
options: ["Yes", "No, it composes a field and promotes selectors", "Only with pointer embedding"]
answer: 1
explain: "Method calls use Go’s receiver and method-set rules, not virtual base-class dispatch."
```

# Enums with iota

Go does not have a closed enum declaration. A named integer type plus constants is a
useful way to model a small state space, but values outside the named constants can
still exist. Validate values received from storage or external input.

Choose zero deliberately: it may mean “unknown” or a safe default. Separate display
names from wire values when compatibility matters.

## Read the example

```annotate
code: |
  package main

  import (
      "fmt"
  )

  type State uint8
  const (
      Unknown State = iota
      Pending
      Paid
      Shipped
  )
  func (s State) Valid() bool { return s >= Pending && s <= Shipped }
  func (s State) String() string {
      switch s {
      case Pending: return "pending"
      case Paid: return "paid"
      case Shipped: return "shipped"
      default: return "unknown"
      }
  }

  func main() {
      state := Paid
      fmt.Println(state, state.Valid())
      fmt.Println(State(99).Valid())
  }

  // Output:
  // paid true
  // false
hotspots: [{"line": 9, "match": "Unknown State = iota", "title": "Reserve zero", "note": "The zero value is deliberately not a valid persisted order state here."}, {"line": 14, "match": "s <= Shipped", "title": "Validation", "note": "A named type still admits other representable integer values."}, {"line": 20, "match": "default: return \"unknown\"", "title": "Unknown-value behavior", "note": "Formatting remains defined even for an unexpected numeric value."}]
```

## Stable values and transitions

Inserting a constant into an iota sequence shifts later values. If numbers are stored
in a database or sent over an API, assign explicit stable values or use stable strings.
Do not let a source-code reorder silently reinterpret old records.

A set of bit flags is a different model: `1 << iota` gives independent bits, and callers
combine them with `|`. Ordinary enum values are mutually exclusive, so combining them
with bitwise operators usually has no meaning.

Validation of a state is separate from validation of a transition. Pending and Shipped
can both be valid values while a direct Pending-to-Shipped transition is forbidden by
business rules. Encode those rules explicitly, and test unknown values as well as the
normal path. A String method provides a label, not automatic JSON encoding as a string.

## Check your understanding

```quiz
type: "mcq"
question: "Does declaring type State uint8 prevent State(99)?"
options: ["Yes, only constants can use State", "No, explicit conversions can create unnamed values", "Only outside the defining package"]
answer: 1
explain: "A defined type improves type distinctions but does not create a closed set of runtime values."
```

```quiz
type: "mcq"
question: "What is risky about inserting an iota constant into persisted numeric values?"
options: ["Later numbers change", "All values become strings", "It changes the integer width"]
answer: 0
explain: "The sequence depends on declaration position, so later values shift unless explicitly assigned."
```

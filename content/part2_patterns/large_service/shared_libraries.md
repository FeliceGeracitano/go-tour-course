# Shared libraries with clear owners

Shared code works best when it has one coherent meaning. In this example, billing and
orders use the same USD amount rules. HTTP integrations share bounded JSON GET mechanics.
All routes share request logging. These responsibilities justify money, httpjson, and
observability packages; a broad common or utils package would hide their differences.

## Share an invariant, not just similar syntax

```annotate
code: |
  // Source: examples/large-service/internal/money/money.go
  // Package money models nonnegative USD cents for this example.
  package money

  import "errors"

  var ErrInvalid = errors.New("amount must be between 0 and 100000000 USD cents")

  type Amount int64

  const Max Amount = 100_000_000

  func (a Amount) Validate() error {
      if a < 0 || a > Max {
          return ErrInvalid
      }
      return nil
  }

  func (a Amount) Add(b Amount) (Amount, error) {
      if a.Validate() != nil || b.Validate() != nil || a > Max-b {
          return 0, ErrInvalid
      }
      return a + b, nil
  }
hotspots: [{"line": 9, "match": "type Amount int64", "title": "Represent the unit explicitly", "note": "An Amount is USD cents in this example. Integer arithmetic avoids binary floating-point rounding for these values."}, {"line": 11, "match": "const Max", "title": "A documented business bound", "note": "This educational API accepts at most 100000000 cents, including the quoted total."}, {"line": 21, "match": "a > Max-b", "title": "Check before addition", "note": "Validated operands and a bounded sum prevent both invalid totals and integer overflow."}]
```

A named integer can still be constructed directly, so services call Validate at their
public boundaries. Add verifies both operands before adding them. This is intentionally
not a universal money library: it has one currency, nonnegative amounts, and one range.
A refund domain that needs negative values or a multi-currency domain has a different
contract. Do not force it into this type simply because both use integers.

The dependency direction matters. money imports no domain package. If it started importing
billing to choose invoice policy, it would no longer be a neutral amount abstraction.
Keep domain-specific decisions, such as how a fee is obtained and whether it can be
included in a quote, inside billing.

The same distinction applies to integrations. httpjson owns request creation, bounded
reading, and decoding; identity owns the meaning of a 404 and payments owns the fee
schema. They share mechanics without sharing provider business meaning. Their constructors
return concrete clients, leaving each consumer to define the interface it actually uses.

## Decide when to extract

Before moving code into a shared package, ask whether its consumers agree on semantics,
who will maintain its contract, and whether a change should affect all consumers. Small
local duplication can be cheaper than coupling domains that merely look similar today.
A shared Customer struct containing every domain's fields often creates that coupling.

Keep reuse within this service under internal. If multiple independently released projects
need a stable library, extract a separately versioned module with its own API and tests.
Go's [layout guidance](https://go.dev/doc/modules/layout) describes this progression.
Neither a pkg directory nor a new go.mod is required for each reusable package. A
workspace can help develop multiple modules locally, but it does not replace released
versions for consumers.

The complete example tests amount boundaries and uses them in assembled route tests.
That verifies both the shared invariant and how domains apply it.

```quiz
{
  "type": "mcq",
  "question": "A refund feature needs negative amounts. Should it silently loosen money.Amount for every domain?",
  "options": [
    "Yes, all monetary values must share one type",
    "No; first decide whether the domains share the same invariant"
  ],
  "answer": 1,
  "explain": "Changing a shared contract changes every consumer. A distinct type may express different semantics more safely."
}
```

```quiz
{
  "type": "mcq",
  "question": "When does a separate module become useful?",
  "options": [
    "Whenever two packages import the same helper",
    "When a stable library needs independent reuse and versioning"
  ],
  "answer": 1,
  "explain": "A package provides an API boundary within a module; a module adds dependency and versioning boundaries."
}
```

# Interfaces and cross-domain workflows

Orders needs two capabilities: determine whether a customer exists and obtain a billing
quote. It does not need every identity API operation or a concrete payments SDK. Small
interfaces keep the contract readable and allow tests to supply behavior directly.
Go's [interface guidance](https://go.dev/wiki/CodeReviewComments#interfaces) recommends
defining interfaces where values are consumed, based on real uses.

## Let the workflow state its dependencies

```annotate
code: |
  // Source: examples/large-service/internal/orders/service.go
  package orders

  import (
      "context"
      "fmt"

      "example.com/large-service/internal/billing"
      "example.com/large-service/internal/customers"
      "example.com/large-service/internal/money"
  )

  // CustomerDirectory is the capability orders needs, not the whole identity API.
  type CustomerDirectory interface {
      Exists(context.Context, string) (bool, error)
  }
  type Quoter interface {
      Quote(context.Context, money.Amount) (billing.Quote, error)
  }

  type Service struct {
      directory CustomerDirectory
      billing   Quoter
  }

  func New(directory CustomerDirectory, billing Quoter) *Service {
      return &Service{directory: directory, billing: billing}
  }

  type Quote struct {
      CustomerID string        `json:"customer_id"`
      Price      billing.Quote `json:"price"`
  }

  func (s *Service) Quote(ctx context.Context, customerID string, subtotal money.Amount) (Quote, error) {
      if !customers.ValidID(customerID) {
          return Quote{}, customers.ErrInvalid
      }
      if err := subtotal.Validate(); err != nil {
          return Quote{}, err
      }
      found, err := s.directory.Exists(ctx, customerID)
      if err != nil {
          return Quote{}, fmt.Errorf("%w: %w", customers.ErrUnavailable, err)
      }
      if !found {
          return Quote{}, customers.ErrNotFound
      }
      price, err := s.billing.Quote(ctx, subtotal)
      if err != nil {
          return Quote{}, fmt.Errorf("quote order: %w", err)
      }
      return Quote{CustomerID: customerID, Price: price}, nil
  }
hotspots: [{"line": 14, "match": "type CustomerDirectory interface", "title": "A consumer-owned capability", "note": "Orders asks only whether a customer exists; customers has a separate LookupName contract."}, {"line": 18, "match": "Quote(context.Context, money.Amount)", "title": "Accept the behavior you need", "note": "billing.Service implicitly satisfies Quoter. The interface uses a billing-owned result type."}, {"line": 49, "match": "s.billing.Quote", "title": "Coordinate through the service API", "note": "Order orchestration delegates price rules to billing rather than copying fee calculations."}]
```

The identity client implements both domain interfaces without importing either interface
declaration. At runtime orders calls that client, but its package imports only the
contracts and values it actually names. Constructors in app connect the implementation
to the consumer.

There is still intentional coupling: orders imports billing for billing.Quote and
customers for ID validation and customer errors. Interfaces do not erase named type
dependencies. This is acceptable for this workflow because an order quote includes a
billing quote. If independently evolving domains need different meanings, introduce a
small adapter that translates between their types; do not move every model to a global
shared package merely to make an import disappear.

## Keep ownership acyclic

The flow validates inputs, checks customer existence, then asks billing for a price.
It short-circuits on a missing customer or failure. Billing does not import orders.
If a later workflow needs both domains in both directions, move coordination to a
higher-level workflow package that depends on each, leaving the domain packages acyclic.

Do not replace a visible dependency cycle with a runtime service locator or callbacks
that conceal the same tangled ownership. Decide which capability owns the operation,
which result each consumer needs, and where translation belongs.

This quote is not a transaction or a reservation. Customer state and fees can change
between calls or immediately after the response. Adding order creation and payment
would require explicit consistency, persistence, idempotency, and failure-recovery design.
A package structure alone cannot provide those guarantees. Start with this small
read-only workflow so those architectural concerns remain distinct and visible.

```quiz
{
  "type": "mcq",
  "question": "Does Quoter remove every dependency from orders to billing?",
  "options": [
    "Yes, interfaces erase all coupling",
    "No, its method signature names billing.Quote"
  ],
  "answer": 1,
  "explain": "Named parameter and result types still establish compile-time dependencies."
}
```

```quiz
{
  "type": "mcq",
  "question": "Billing now needs to import orders, producing a cycle. What is a useful redesign?",
  "options": [
    "Hide the imports behind global lookups",
    "Move coordination to a package that depends on both domains"
  ],
  "answer": 1,
  "explain": "A higher-level workflow can orchestrate both without either domain importing the other."
}
```

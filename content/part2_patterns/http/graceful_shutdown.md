# Graceful shutdown

Graceful shutdown stops accepting new work and gives active requests time to finish.
The process must remain alive while that drain happens. Simply launching Shutdown in
a goroutine and returning from main can terminate requests immediately.

Use one signal context for the shutdown trigger and a fresh timeout context for draining.
The trigger is already cancelled when shutdown begins, so it is not a useful drain budget.

## Read the example

```annotate
code: |
  package main

  import (
      "context"
      "errors"
      "fmt"
      "net/http"
      "os"
      "os/signal"
      "syscall"
      "time"
  )

  func main() {
      if err := run(); err != nil { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
  }
  func run() error {
      signalCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
      defer stop()
      mux := http.NewServeMux()
      mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, "ok") })
      srv := &http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout: 5 * time.Second}
      served := make(chan error, 1)
      go func() { served <- srv.ListenAndServe() }()
      select {
      case err := <-served:
          if errors.Is(err, http.ErrServerClosed) { return nil }
          return err
      case <-signalCtx.Done():
      }
      stop()
      drainCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
      defer cancel()
      if err := srv.Shutdown(drainCtx); err != nil {
          _ = srv.Close()
          return fmt.Errorf("shutdown: %w", err)
      }
      if err := <-served; !errors.Is(err, http.ErrServerClosed) { return err }
      return nil
  }
hotspots: [{"line": 23, "match": "served := make(chan error, 1)", "title": "Observe startup and serving failure", "note": "The result channel also prevents the server goroutine from blocking while main handles shutdown."}, {"line": 32, "match": "context.WithTimeout(context.Background()", "title": "Independent drain deadline", "note": "This context is fresh even though the signal context is already cancelled."}, {"line": 34, "match": "srv.Shutdown(drainCtx)", "title": "Wait for ordinary requests", "note": "Main stays inside run until graceful draining completes or fails."}]
```

## Define what is drained

Run this program locally and send an interrupt to stop it. The health route is immediate;
to observe draining, temporarily add a slow handler and interrupt while a request is active.
Shutdown closes listeners, closes idle connections, and waits for active ordinary
connections to become idle within the context deadline.

If the deadline expires, the example closes remaining connections and reports failure.
Long-lived hijacked connections such as WebSockets need their own shutdown coordination.
Background workers, queues, and database clients also have independent lifetimes; stopping
the HTTP listener does not join them automatically.

In a deployed service, stop readiness or remove the instance from routing before draining
when the platform requires that sequence. Choose a drain budget shorter than the platform's
forced termination window. Treat http.ErrServerClosed as the expected serving result of
an intentional shutdown, while still surfacing bind errors and unexpected failures.

## Check your understanding

```quiz
type: "mcq"
question: "Why not pass signalCtx directly to Shutdown after the signal arrives?"
options: ["It is already cancelled", "It has the wrong type", "It would restart the server"]
answer: 0
explain: "An already-cancelled context offers no useful time to drain requests."
```

```quiz
type: "mcq"
question: "Does Shutdown automatically wait for hijacked WebSocket connections?"
options: ["Yes", "No, coordinate them separately", "Only if the health route exists"]
answer: 1
explain: "Hijacked connections and background workers need their own lifecycle handling."
```

## Further reading

[Server.Shutdown contract](https://pkg.go.dev/net/http#Server.Shutdown)

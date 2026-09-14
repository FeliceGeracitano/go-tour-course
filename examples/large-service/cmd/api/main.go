package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"example.com/large-service/internal/app"
)

func main() {
	if err := run(); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	application, err := app.New(app.FromEnv(), slog.Default())
	if err != nil {
		return err
	}
	defer application.Close()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	slog.Info("starting server", "address", "127.0.0.1:8080")
	return app.Serve(ctx, app.Server("127.0.0.1:8080", application.Handler))
}

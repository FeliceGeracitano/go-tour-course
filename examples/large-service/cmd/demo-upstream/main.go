package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"example.com/large-service/internal/app"
	"example.com/large-service/internal/demoupstream"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	slog.Info("starting demo upstream", "address", "127.0.0.1:9090")
	if err := app.Serve(ctx, app.Server("127.0.0.1:9090", demoupstream.Handler())); err != nil {
		slog.Error("demo stopped", "error", err)
		os.Exit(1)
	}
}

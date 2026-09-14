package main

import (
	"log/slog"

	"go.uber.org/fx"

	"example.com/large-service/internal/app"
	"example.com/large-service/internal/withfx"
)

func main() {
	fx.New(
		fx.Provide(app.FromEnv, slog.Default),
		fx.Supply(withfx.ListenAddress("127.0.0.1:8080")),
		withfx.Module,
	).Run()
}

// Package withfx adapts explicit application constructors to Fx lifetime management.
package withfx

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"

	"go.uber.org/fx"

	"example.com/large-service/internal/app"
)

type ListenAddress string

// Module expects app.Config, ListenAddress, and *slog.Logger from its caller.
var Module = fx.Module("quote-service",
	fx.Provide(newApplication, newServer),
	fx.Invoke(func(*http.Server) {}),
)

func newApplication(lifecycle fx.Lifecycle, config app.Config, log *slog.Logger) (*app.Application, error) {
	application, err := app.New(config, log)
	if err != nil {
		return nil, err
	}
	lifecycle.Append(fx.Hook{OnStop: func(context.Context) error { application.Close(); return nil }})
	return application, nil
}

func newServer(lifecycle fx.Lifecycle, application *app.Application, address ListenAddress, shutdown fx.Shutdowner, log *slog.Logger) *http.Server {
	server := app.Server(string(address), application.Handler)
	done := make(chan error, 1)
	lifecycle.Append(fx.Hook{
		OnStart: func(context.Context) error {
			listener, err := net.Listen("tcp", server.Addr)
			if err != nil {
				return err
			}
			server.Addr = listener.Addr().String()
			go func() {
				err := server.Serve(listener)
				done <- err
				if !errors.Is(err, http.ErrServerClosed) {
					log.Error("HTTP server failed", "error", err)
					_ = shutdown.Shutdown(fx.ExitCode(1))
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			err := server.Shutdown(ctx)
			if err != nil {
				_ = server.Close()
			}
			<-done
			return err
		},
	})
	return server
}

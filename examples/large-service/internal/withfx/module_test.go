package withfx

import (
	"context"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"

	"example.com/large-service/internal/app"
	"example.com/large-service/internal/demoupstream"
)

func TestModuleServesAndStops(t *testing.T) {
	upstream := httptest.NewServer(demoupstream.Handler())
	defer upstream.Close()
	var server *http.Server
	application := fxtest.New(t,
		fx.Supply(app.Config{IdentityURL: upstream.URL, PaymentsURL: upstream.URL}, ListenAddress("127.0.0.1:0"), slog.New(slog.NewTextHandler(io.Discard, nil))),
		Module, fx.Populate(&server),
	)
	application.RequireStart()
	client := &http.Client{Timeout: time.Second}
	defer client.CloseIdleConnections()
	response, err := client.Get("http://" + server.Addr + "/orders/quote?customer_id=c1&cents=1000")
	if err != nil {
		application.RequireStop()
		t.Fatal(err)
	}
	response.Body.Close()
	if response.StatusCode != 200 {
		application.RequireStop()
		t.Fatalf("status %d", response.StatusCode)
	}
	application.RequireStop()
	connection, err := net.DialTimeout("tcp", server.Addr, time.Second)
	if err == nil {
		connection.Close()
		t.Fatal("listener still open")
	}
}

func TestModuleReportsBindFailure(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	application := fxtest.New(t,
		fx.Supply(app.Config{IdentityURL: "http://localhost:9090", PaymentsURL: "http://localhost:9090"}, ListenAddress(listener.Addr().String()), slog.New(slog.NewTextHandler(io.Discard, nil))), Module,
	)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	if err := application.Start(ctx); err == nil {
		application.RequireStop()
		t.Fatal("expected bind error")
	}
}

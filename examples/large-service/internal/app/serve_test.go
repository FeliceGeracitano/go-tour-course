package app

import (
	"context"
	"net"
	"net/http"
	"testing"
	"time"
)

func TestServeReportsBindFailure(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	if err := Serve(context.Background(), Server(listener.Addr().String(), http.NotFoundHandler())); err == nil {
		t.Fatal("expected bind failure")
	}
}

func TestServeStopsOnCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	done := make(chan error, 1)
	go func() { done <- Serve(ctx, Server("127.0.0.1:0", http.NotFoundHandler())) }()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("shutdown hung")
	}
}

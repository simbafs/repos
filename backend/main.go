package main

import (
	"embed"
	"fmt"
	"net/http"

	"github.com/simbafs/kama"
)

//go:embed all:static/*
var static embed.FS

func authGithubApp() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from the authGithubApp handler!")
	}
}

func run() error {
	mux := http.NewServeMux()

	mux.HandleFunc("/auth/github", authGithubApp())
	mux.HandleFunc("/", kama.New(static).Go())

	return http.ListenAndServe(":3000", mux)
}

func main() {
	if err := run(); err != nil {
		panic(err)
	}
}

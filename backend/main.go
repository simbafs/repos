package main

import (
	"embed"
	"log"
	"net/http"

	"backend/config"

	"github.com/simbafs/kama"
)

//go:embed all:static/*
var static embed.FS

func run(conf *config.Config) error {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /auth/github", GitHubOAuthCallbackHandler(conf.ClientID, conf.ClientSecret))
	mux.HandleFunc("/", kama.New(static, kama.WithTree(conf.Tree)).Go())

	return http.ListenAndServe(":3000", mux)
}

func main() {
	log.SetFlags(log.Lshortfile)
	conf := config.NewFromEnv()

	if err := run(conf); err != nil {
		panic(err)
	}
}

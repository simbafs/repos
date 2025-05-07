package config

import "os"

type Config struct {
	ClientID     string
	ClientSecret string
	Tree         string
}

func NewFromEnv() *Config {
	c := &Config{}
	c.ClientID = os.Getenv("GITHUB_CLIENT_ID")
	c.ClientSecret = os.Getenv("GITHUB_CLIENT_SECRET")
	c.Tree = os.Getenv("TREE")

	if c.ClientID == "" {
		panic("GITHUB_CLIENT_ID is not set")
	}
	if c.ClientSecret == "" {
		panic("GITHUB_CLIENT_SECRET is not set")
	}
	return c
}

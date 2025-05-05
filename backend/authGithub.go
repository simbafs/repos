package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type AuthRequest struct {
	Code string `json:"code"`
}

type GitHubAccessTokenResponse struct {
	AccessToken string `json:"access_token"`
	Error       string `json:"error"`
}

func GitHubOAuthCallbackHandler(clientID, clientSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req AuthRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			log.Println("Error decoding JSON:", err)
			return
		}

		payload := map[string]string{
			"client_id":     clientID,
			"client_secret": clientSecret,
			"code":          req.Code,
		}
		payloadBytes, _ := json.Marshal(payload)

		req2, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", bytes.NewBuffer(payloadBytes))
		if err != nil {
			http.Error(w, "Request creation failed", http.StatusInternalServerError)
			return
		}
		req2.Header.Set("Content-Type", "application/json")
		req2.Header.Set("Accept", "application/json")

		resp, err := http.DefaultClient.Do(req2)
		if err != nil {
			http.Error(w, "Failed to contact GitHub", http.StatusBadGateway)
			log.Println("Error calling GitHub:", err)
			return
		}
		defer resp.Body.Close()

		var ghResp GitHubAccessTokenResponse
		if err := json.NewDecoder(resp.Body).Decode(&ghResp); err != nil {
			http.Error(w, "Failed to parse GitHub response", http.StatusInternalServerError)
			log.Println("Error parsing GitHub response:", err)
			return
		}

		if ghResp.AccessToken == "" {
			http.Error(w, "GitHub OAuth error: "+ghResp.Error, http.StatusUnauthorized)
			log.Println("GitHub OAuth error:", ghResp.Error)
			return
		}

		// 回傳 token 給前端
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"access_token": ghResp.AccessToken,
		})
	}
}

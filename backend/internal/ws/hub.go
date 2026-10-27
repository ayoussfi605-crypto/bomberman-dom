package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://127.0.0.1:5500" ||
			r.Header.Get("Origin") == "http://localhost:5500"
	},
}

type IncomingMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type JoinPayload struct {
	Nickname string `json:"nickname"`
}

func HandleWs(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade:", err)
		return
	}

	client := &Client{
		Conn: conn,
		Send: make(chan []byte, 16),
	}
	fmt.Println("from ws", client)

	go client.WritePump()
	client.ReadPump()
}

func (c *Client) ReadPump() {
	defer func() {
		if c.Name != "" {
			GlobalWs.UnRegister <- c
		}
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var incoming IncomingMessage
		if err := json.Unmarshal(message, &incoming); err != nil {
			continue
		}

		// Require the first message to be a join request.
		if c.Name == "" {
			if incoming.Type != "join" {
				break
			}

			var payload JoinPayload
			if err := json.Unmarshal(incoming.Payload, &payload); err != nil {
				break
			}

			c.Name = strings.TrimSpace(payload.Nickname)
			if c.Name == "" {
				break
			}

			GlobalWs.Register <- c

		}

		GlobalWs.Brodcast <- message
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()

	for message := range c.Send {
		if err := c.Conn.WriteMessage(
			websocket.TextMessage,
			message,
		); err != nil {
			return
		}
	}
}

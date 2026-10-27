package ws

import (
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

var GlobalWs *Hub

type Client struct {
	Name string
	Conn *websocket.Conn
	Send chan []byte
}
type Room struct {
	Players map[*Client]bool
	Started bool
}

type Hub struct {
	Clients    map[string]map[*Client]bool
	Register   chan *Client
	UnRegister chan *Client
	Brodcast   chan []byte
	Room       *Room
	MX         sync.Mutex
}

func InitHub() *Hub {
	room := &Room{
		Players: make(map[*Client]bool),
	}
	return &Hub{
		Clients:    map[string]map[*Client]bool{},
		Register:   make(chan *Client),
		UnRegister: make(chan *Client),
		Brodcast:   make(chan []byte),
		Room:       room,
	}
}

func ManageHub(hub *Hub) {
	for {
		select {
		case client := <-hub.Register:
			hub.HandleRegister(client)
		case client := <-hub.UnRegister:
			hub.HandleUnRegister(client)
		case message := <-hub.Brodcast:
			hub.HandleBrodcast(message)
		}
		fmt.Println("globa", GlobalWs.Clients)
	}
}

func (h *Hub) HandleRegister(client *Client) {
	h.MX.Lock()
	defer h.MX.Unlock()
	fmt.Println("clent\n\n", client)

	if h.Clients[client.Name] == nil {
		h.Clients[client.Name] = make(map[*Client]bool)
	}
	h.Clients[client.Name][client] = true
}

func (h *Hub) HandleUnRegister(client *Client) {
	h.MX.Lock()
	defer h.MX.Unlock()
	clients, exists := h.Clients[client.Name]

	if !exists {
		return
	}
	_, exists = clients[client]

	if !exists {
		return
	}
	delete(clients, client)
	close(client.Send)

	if len(clients) == 0 {
		delete(h.Clients, client.Name)
	}
}

func (h *Hub) HandleBrodcast(message []byte) {
	fmt.Println("message", string(message))
	h.MX.Lock()
	defer h.MX.Unlock()
	for _, clients := range h.Clients {
		for client := range clients {
			select {
			case client.Send <- message:
			default:
				// nothing to do Now
			}
		}
	}
}

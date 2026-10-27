package main

import (
	"fmt"
	"net/http"

	"bomber/internal/ws"
	"bomber/middleware"
)

func main() {
	router := http.NewServeMux()

	ws.GlobalWs = ws.InitHub()
	go ws.ManageHub(ws.GlobalWs)

	router.HandleFunc("/api/ws", ws.HandleWs)

	fmt.Println("Heloo")
	err := http.ListenAndServe(":8080", middleware.CORS(router))
	if err != nil {
		fmt.Println(err)
		return
	}
}

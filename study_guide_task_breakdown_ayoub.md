# Phase 1 Breakdown: Architecture, Project Setup & Framework

This document breaks down the initial setup phase into smaller, manageable tasks. For each task, there are specific concepts and terms you should research to understand the *why* and *how* before writing the code.

---

## Phase 1.1: Repository & Workspace Setup

### Task 1: Initialize the Monorepo Structure
**What to do:** Create a root folder for your project. Inside it, create two separate directories: `backend/` and `frontend/`.
**Terms/Questions to Study:**
* What is a "monorepo" architecture?
* What are the pros and cons of keeping the frontend and backend in the same repository?

### Task 2: Configure Version Control
**What to do:** Initialize Git (`git init`) and create a `.gitignore` file in the root directory. Ensure it ignores Node modules, Go binaries, and OS-specific files (like `.DS_Store`).
**Terms/Questions to Study:**
* What is a `.gitignore` file and how do wildcards (`*`) work inside it?
* What are the standard `.gitignore` rules for Go and Node.js projects?

### Task 3: Setup the Local Development Runner
**What to do:** Create either a `Makefile` or a `docker-compose.yml` file at the root level to start both the Go server and the frontend build process with a single command.
**Terms/Questions to Study:**
* *If using Makefile:* How do I write a Makefile target to run multiple shell commands concurrently?
* *If using Docker Compose:* What is `docker-compose.yml`? How do I define multiple services (frontend and backend) in one file?

---

## Phase 1.2: Go Backend Foundation

### Task 4: Initialize the Go Module
**What to do:** Navigate to the `backend/` directory and run `go mod init bomberman-dom`. Create the initial folder structure (`cmd/server/main.go`).
**Terms/Questions to Study:**
* What is `go mod init` and how does Go manage dependencies?
* What is the standard project layout for Go applications (e.g., `cmd/`, `internal/` directories)?

### Task 5: Setup the Base HTTP Server
**What to do:** Inside `main.go`, set up a basic HTTP server using `net/http.ServeMux` that listens on a specific port (e.g., 8080).
**Terms/Questions to Study:**
* What is a multiplexer (`ServeMux`) in Golang?
* How does the `net/http` package handle incoming web requests?

### Task 6: Implement Static File Serving
**What to do:** Configure the Go server to serve the static HTML, CSS, and JS files located in the `frontend/` directory.
**Terms/Questions to Study:**
* How do I use `http.FileServer` and `http.Dir` in Golang?
* What is the difference between an API route and a static file route?

### Task 7: Add Logging Middleware
**What to do:** Write a simple middleware function in Go that intercepts incoming HTTP requests and logs the method (GET/POST) and the URL path before passing it to the handler.
**Terms/Questions to Study:**
* What is "middleware" in the context of web servers?
* How do you write a custom middleware function in Go using `http.HandlerFunc`?

---

## Phase 1.3: Mini-Framework Integration & Styling

### Task 8: Scaffold the Frontend Framework
**What to do:** Create the `frontend/src/framework/` directory and set up empty files for `vdom.js`, `hyperscript.js`, and `router.js`.
**Terms/Questions to Study:**
* What is a Virtual DOM (VDOM) and why do modern frameworks use it?
* What is "hyperscript" (the `h()` function) and how does it map to HTML elements?

### Task 9: Implement State Management
**What to do:** Create the `store.js` file and build a simple class or function that holds state data and triggers updates when that data changes.
**Terms/Questions to Study:**
* What is the "Observer pattern" or "Pub/Sub pattern" in JavaScript?
* How does "reactive state management" work under the hood?

### Task 10: Setup Base Styles and Layout
**What to do:** Create `main.css`. Implement a CSS Grid layout that will hold the game board in the center and a chat UI on the side. Define CSS variables for a "dark mode" retro arcade theme.
**Terms/Questions to Study:**
* How does `display: grid` work for defining rows and columns?
* What are CSS custom properties (CSS variables) and how are they used to implement dark mode?
* What are best practices for styling a 2D game board using HTML/CSS?
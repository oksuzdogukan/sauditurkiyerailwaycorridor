# Saudi–Türkiye Railway Corridor Management System

Containerized full-stack railway management system for managing international train routes, stations, and passenger reservations between Saudi Arabia and Türkiye. The project uses a microservices-style architecture orchestrated with Docker Compose.

---

## Tech Stack
- Backend: Node.js (REST API)
- Frontend: React (SPA) served via Nginx
- Database: MySQL 8.0
- Containerization: Docker + Docker Compose

---

## Project Structure
```text
├── backend/              # Node.js REST API
│   ├── Dockerfile
│   └── server.js
├── frontend/             # React SPA (served with Nginx)
│   ├── Dockerfile
│   └── nginx.conf
├── database/             # MySQL initialization scripts
│   └── sasa.sql
└── docker-compose.yml    # Multi-container setup
Prerequisites

Make sure the following are installed:

Docker Desktop
Docker Compose v2
Setup & Run
1. Clone / Extract Project

Extract the project into a clean directory.

2. Start the System

Run the following command in the root folder (where docker-compose.yml is located):

docker compose up --build


Services
Frontend
URL: http://localhost:5173
Backend API
URL: http://localhost:3000
Database (MySQL)
Host: localhost
Port: 3307
Database: sauditurkiyerailwaycorridor
Username: root
Password: rootpassword


Troubleshooting
API cannot connect to database (EAI_AGAIN / startup issue)

This usually happens because MySQL is still initializing when the API starts.

Fix:

docker compose restart backend

# CodeCollab V2

![Architecture Diagram](file:///C:/Users/Dell/.gemini/antigravity/brain/3e6eade9-6abe-4753-9cbc-5f01af650241/architecture_diagram_1784738801322.jpg)

## Overview
CodeCollab V2 is a collaborative development platform that showcases modern **full‑stack** architecture with **glassmorphic UI**, **DSA‑powered backend**, and **multi‑language analytics**.

- **Frontend** – HTML/CSS/JavaScript SPA with smooth micro‑animations, skeleton loaders, and dynamic project cards.
- **Backend** – Node.js + Express API (`server.js`).
    - **LRU Cache** for O(1) repeated‑query response.
    - **Trie** for ultra‑fast prefix search of project titles.
    - **Prisma ORM** connects to a Dockerized PostgreSQL database.
- **Analytics** – A Python script (`analytics.py`) calculates a **Complexity Score** for each project and is invoked from the Node server.
- **Deploy** – Docker Compose for the database, simple `node server.js` to start the API, and a lightweight Python HTTP server for the static UI.

## Features
- Dynamic project cards loaded from the API (including difficulty, category, tech‑stack badges, and the computed complexity score).
- Real‑time search and filter UI powered by the Trie search engine.
- LRU caching reduces database load for repeat queries.
- Multi‑language integration (JavaScript for the API, Python for analytics).
- Glass‑morphic design with vibrant gradients, subtle shadows, and smooth hover effects.

## Quick Start
```bash
# Clone the repo (already on the db-connect branch)
git clone https://github.com/404Dev-notFound/jubilant-octo-potato.git
cd codecollab_v2

# Start the PostgreSQL container
docker-compose up -d

# Install Node dependencies
npm install

# Run the API server (will also spawn the Python analytics script)
node server.js

# In another terminal, serve the static frontend
python -m http.server 8080

# Open the app
open http://localhost:8080/#explore
```

## Architecture Diagram
The diagram above illustrates the data flow:
1. **Frontend** sends a request to `http://localhost:3000/api/projects`.
2. **Express API** checks the **LRU Cache** → falls back to **Trie** → queries the **PostgreSQL** via **Prisma**.
3. The **Node** process spawns **analytics.py** (Python) to compute a **Complexity Score**.
4. The enriched JSON response is returned to the frontend, which renders the glass‑morphic project cards.

## UI Animation
Below is a short GIF that shows the skeleton loader fading into a fully populated project card, demonstrating the micro‑animation experience offered by the app.

![UI Loading Animation](file:///C:/Users/Dell/.gemini/antigravity/brain/3e6eade9-6abe-4753-9cbc-5f01af650241/ui_animation_1784738817860.jpg)

## Development Notes
- **DSA Modules** are located in `js/app.js` (Trie) and `server.js` (LRU Cache). Feel free to extend them.
- **Python analytics** can be edited in `analytics.py` – any additional metrics can be added and will be automatically merged into the API response.
- **Docker** configuration lives in `docker-compose.yml`. Adjust the `POSTGRES_PASSWORD` in `.env` if you change credentials.

## License
MIT © 2026 404Dev-notFound
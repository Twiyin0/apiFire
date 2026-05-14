# Apifire

A lightweight API testing tool built with Vue 3 + Vite + Tailwind CSS. Supports HTTP requests, WebSocket, and TCP connections.

## Features

- **HTTP Client** — Send GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS requests with custom headers, body, and query params
- **Code Generator** — Auto-generate request code in Node.js, Python, Java, C#, cURL, Go
- **WebSocket Client** — Connect to WebSocket servers and send/receive messages
- **WebSocket Server** — Start a local WS server, manage clients, broadcast messages
- **TCP Client** — Connect to TCP servers and exchange data
- **TCP Server** — Start a local TCP server, manage clients, broadcast data
- **Dark Mode** — Toggle between light and dark themes

## Deployment Modes

The project supports two deployment modes, controlled by the `VITE_DEPLOY` environment variable:

### Vercel (Cloud)

```
VITE_DEPLOY=vercel
```

- Frontend is served as a static Vite build
- HTTP proxy runs as a Vercel Serverless Function (`/api/proxy`)
- **WS Client** uses browser-native WebSocket (direct connection, no relay)
- **WS Server / TCP Client / TCP Server** are disabled (requires backend runtime)

**Deploy to Vercel:**

1. Import the repo on [vercel.com](https://vercel.com)
2. Set the environment variable `VITE_DEPLOY=vercel` in Project Settings > Environment Variables
3. Vercel auto-detects Vite — no extra config needed

### Local

```
VITE_DEPLOY=local
```

- Full functionality: all features including WS/TCP server and client
- Backend relay server (`server/index.js`) handles WS/TCP connections
- HTTP proxy also available via the backend

**Run locally:**

```bash
# Install dependencies
yarn install
cd server && yarn install && cd ..

# Start both frontend and backend
yarn dev:full

# Or start separately
yarn dev          # frontend only (port 5173)
yarn dev:server   # backend only (port 3001)
```

## Project Structure

```
.
├── api/
│   └── proxy.js          # Vercel Serverless Function (HTTP proxy)
├── server/
│   └── index.js          # Local backend server (Express + WS + TCP)
├── src/
│   ├── components/       # Vue components
│   ├── composables/      # Vue composables (useSocket, useTheme)
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── .env                  # VITE_DEPLOY=local|vercel
```

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_DEPLOY` | `local` (default) / `vercel` | Deployment mode. Controls WS/TCP behavior and server connection |

## License

[MIT](LICENSE)

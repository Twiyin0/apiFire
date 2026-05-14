import { ref, shallowRef } from 'vue'

const deployMode = import.meta.env.VITE_DEPLOY || 'local'
const isVercel = deployMode === 'vercel'

let ws = null
const handlers = new Map()
const connected = ref(false)
const reconnectTimer = shallowRef(null)

function connect() {
  // In vercel mode, no backend relay server — skip WS connection
  if (isVercel) return

  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${location.hostname}:3001/ws`)

  ws.onopen = () => {
    connected.value = true
  }

  ws.onclose = () => {
    connected.value = false
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = setTimeout(connect, 2000)
  }

  ws.onerror = () => {
    connected.value = false
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      handlers.forEach((fn) => fn(msg))
    } catch {}
  }
}

function send(type, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }))
  }
}

function onMessage(id, handler) {
  handlers.set(id, handler)
  return () => handlers.delete(id)
}

export function useSocket() {
  if (!isVercel && !ws) connect()

  return { connected, send, onMessage, reconnect: connect, isVercel }
}

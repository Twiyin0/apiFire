import { ref, shallowRef } from 'vue'

let ws = null
const handlers = new Map()
const connected = ref(false)
const reconnectTimer = shallowRef(null)

function connect() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${location.hostname}:3001/ws`)

  ws.onopen = () => {
    connected.value = true
  }

  ws.onclose = () => {
    connected.value = false
    // Reconnect after 2s
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = setTimeout(connect, 2000)
  }

  ws.onerror = () => {
    connected.value = false
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      // Dispatch to registered handlers
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
  // Auto-connect on first use
  if (!ws) connect()

  return { connected, send, onMessage, reconnect: connect }
}

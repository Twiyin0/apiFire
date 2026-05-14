<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useSocket } from '../composables/useSocket'
import MessageLog from './MessageLog.vue'

const { send, onMessage } = useSocket()

const port = ref(9000)
const running = ref(false)
const inputMsg = ref('')
const selectedClient = ref('*')
const clients = reactive([])
const messages = reactive([])
const serverId = 'tcp-server-' + Date.now()

function addLog(direction, content, type = 'msg') {
  messages.push({ direction, content, type: type === 'msg' ? '' : type, timestamp: Date.now() })
}

const unsub = onMessage(serverId, (msg) => {
  switch (msg.type) {
    case 'tcp-server:started':
      running.value = true
      addLog('recv', `TCP Server started on port ${msg.port}`, 'system')
      break
    case 'tcp-server:connection':
      clients.push(msg.clientId)
      addLog('recv', `Client connected: ${msg.clientId}`, 'system')
      break
    case 'tcp-server:data':
      addLog('recv', `[${msg.clientId}] ${msg.data}`)
      break
    case 'tcp-server:disconnection':
      const idx = clients.indexOf(msg.clientId)
      if (idx >= 0) clients.splice(idx, 1)
      addLog('recv', `Client disconnected: ${msg.clientId}`, 'system')
      break
    case 'tcp-server:error':
      addLog('recv', `Error: ${msg.error}`, 'error')
      break
  }
})

onUnmounted(() => { unsub() })

function startServer() {
  send('tcp-server:start', { serverId, port: Number(port.value) })
}

function stopServer() {
  send('tcp-server:stop', { serverId })
  running.value = false
  clients.splice(0, clients.length)
  addLog('sent', 'Server stopped', 'system')
}

function sendMessage() {
  if (!inputMsg.value.trim()) return
  if (selectedClient.value === '*') {
    send('tcp-server:broadcast', { serverId, data: inputMsg.value })
    addLog('sent', `[Broadcast] ${inputMsg.value}`)
  } else {
    send('tcp-server:send', { serverId, clientId: selectedClient.value, data: inputMsg.value })
    addLog('sent', `[${selectedClient.value}] ${inputMsg.value}`)
  }
  inputMsg.value = ''
}

function clearLog() {
  messages.splice(0, messages.length)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 px-5 py-4 border-b border-surface-200/70 dark:border-surface-800 bg-white/40 dark:bg-surface-900/40">
      <div class="flex gap-2 items-center">
        <div class="flex items-center px-3 h-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-300 text-sm font-bold">
          TCP Server
        </div>
        <input
          v-model="port"
          type="number"
          placeholder="Port"
          :disabled="running"
          class="w-28 input-base font-mono"
        />
        <button v-if="!running" @click="startServer" class="btn-success">Start</button>
        <button v-else @click="stopServer" class="btn-danger">Stop</button>
        <div class="ml-auto flex items-center gap-2 text-xs">
          <span class="dot" :class="running ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'"></span>
          <span :class="running ? 'text-emerald-600 dark:text-emerald-300' : 'text-surface-500 dark:text-surface-400'" class="font-medium">
            {{ running ? `Running on port ${port}` : 'Stopped' }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 flex">
      <!-- Left: Clients list -->
      <div class="w-60 flex-shrink-0 border-r border-surface-200/70 dark:border-surface-800 flex flex-col bg-surface-50/40 dark:bg-surface-900/40">
        <div class="flex-shrink-0 px-4 py-2.5 border-b border-surface-200/70 dark:border-surface-800">
          <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Clients ({{ clients.length }})</span>
        </div>
        <div class="flex-1 overflow-auto p-2 space-y-0.5">
          <div v-if="!clients.length" class="text-xs text-surface-400 dark:text-surface-500 p-3 text-center italic">No clients connected</div>
          <div
            v-for="clientId in clients"
            :key="clientId"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-surface-600 dark:text-surface-300 hover:bg-surface-100/70 dark:hover:bg-surface-800/60 transition-colors"
          >
            <span class="dot bg-emerald-500 flex-shrink-0"></span>
            <span class="truncate">{{ clientId }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Send + Log -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="flex-shrink-0 px-5 py-4 border-b border-surface-200/70 dark:border-surface-800">
          <div class="flex gap-2">
            <select v-model="selectedClient" :disabled="!running" class="input-base">
              <option value="*">Broadcast</option>
              <option v-for="c in clients" :key="c" :value="c">{{ c }}</option>
            </select>
            <input
              v-model="inputMsg"
              type="text"
              placeholder="Type data to send..."
              :disabled="!running"
              class="flex-1 input-base"
              @keydown.enter="sendMessage"
            />
            <button @click="sendMessage" :disabled="!running" class="btn-primary">Send</button>
          </div>
        </div>

        <div class="flex-1 min-h-0 p-5">
          <div class="h-full flex flex-col card overflow-hidden">
            <div class="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-surface-200/70 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/60">
              <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Data Log ({{ messages.length }})</span>
              <button @click="clearLog" class="text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-rose-500 transition-colors">Clear</button>
            </div>
            <div class="flex-1 min-h-0">
              <MessageLog :messages="messages" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

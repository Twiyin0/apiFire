<script setup>
import { ref, reactive, onUnmounted, computed } from 'vue'
import { useSocket } from '../composables/useSocket'
import MessageLog from './MessageLog.vue'

const { send, onMessage } = useSocket()

const host = ref('localhost')
const port = ref(9000)
const status = ref('disconnected')
const inputMsg = ref('')
const encoding = ref('utf-8')
const messages = reactive([])
const requestId = 'tcp-client-' + Date.now()

const statusInfo = computed(() => ({
  disconnected: { color: 'bg-surface-300 dark:bg-surface-600', label: 'Disconnected', text: 'text-surface-500 dark:text-surface-400' },
  connecting:   { color: 'bg-amber-500 animate-pulse', label: 'Connecting',   text: 'text-amber-600 dark:text-amber-300' },
  connected:    { color: 'bg-emerald-500', label: 'Connected', text: 'text-emerald-600 dark:text-emerald-300' },
}[status.value]))

function addLog(direction, content, type = 'msg') {
  messages.push({ direction, content, type: type === 'msg' ? '' : type, timestamp: Date.now() })
}

const unsub = onMessage(requestId, (msg) => {
  switch (msg.type) {
    case 'tcp:connected':
      status.value = 'connected'
      addLog('recv', `Connected to ${host.value}:${port.value}`, 'system')
      break
    case 'tcp:data':
      addLog('recv', msg.data)
      break
    case 'tcp:disconnected':
      status.value = 'disconnected'
      addLog('recv', 'Connection closed', 'system')
      break
    case 'tcp:error':
      status.value = 'disconnected'
      addLog('recv', `Error: ${msg.error}`, 'error')
      break
  }
})

onUnmounted(() => { unsub() })

function connect() {
  status.value = 'connecting'
  addLog('sent', `Connecting to ${host.value}:${port.value}...`, 'system')
  send('tcp:connect', { requestId, host: host.value, port: Number(port.value) })
}

function disconnect() {
  send('tcp:disconnect', { requestId })
  status.value = 'disconnected'
}

function sendMessage() {
  if (!inputMsg.value.trim()) return
  send('tcp:send', { requestId, data: inputMsg.value })
  addLog('sent', inputMsg.value)
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
          TCP
        </div>
        <input
          v-model="host"
          type="text"
          placeholder="Host"
          :disabled="status !== 'disconnected'"
          class="w-44 input-base font-mono"
        />
        <input
          v-model="port"
          type="number"
          placeholder="Port"
          :disabled="status !== 'disconnected'"
          class="w-28 input-base font-mono"
        />
        <button v-if="status === 'disconnected'" @click="connect" class="btn-primary">Connect</button>
        <button v-else @click="disconnect" :disabled="status === 'connecting'" class="btn-danger">
          {{ status === 'connecting' ? 'Connecting...' : 'Disconnect' }}
        </button>
      </div>
      <div class="mt-3 flex items-center gap-2 text-xs">
        <span class="dot" :class="statusInfo.color"></span>
        <span :class="statusInfo.text" class="font-medium">{{ statusInfo.label }}</span>
      </div>
    </div>

    <!-- Send area -->
    <div class="flex-shrink-0 px-5 py-4 border-b border-surface-200/70 dark:border-surface-800">
      <div class="flex gap-2">
        <select v-model="encoding" class="input-base">
          <option value="utf-8">UTF-8</option>
          <option value="hex">Hex</option>
        </select>
        <input
          v-model="inputMsg"
          type="text"
          placeholder="Type data to send..."
          :disabled="status !== 'connected'"
          class="flex-1 input-base"
          @keydown.enter="sendMessage"
        />
        <button @click="sendMessage" :disabled="status !== 'connected'" class="btn-success">Send</button>
      </div>
    </div>

    <!-- Message log -->
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
</template>

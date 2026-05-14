<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({ messages: Array })

const logContainer = ref(null)

watch(() => props.messages.length, async () => {
  await nextTick()
  if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight
})

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

function msgClass(msg) {
  if (msg.type === 'error') return 'text-rose-500 dark:text-rose-300'
  if (msg.type === 'system') return 'text-amber-500 dark:text-amber-300'
  if (msg.direction === 'sent') return 'text-blue-500 dark:text-blue-300'
  return 'text-emerald-500 dark:text-emerald-300'
}

function rowBg(msg) {
  if (msg.type === 'error') return 'hover:bg-rose-500/5'
  if (msg.type === 'system') return 'hover:bg-amber-500/5'
  return 'hover:bg-surface-100/60 dark:hover:bg-surface-800/40'
}

function directionIcon(msg) {
  if (msg.type === 'error') return '✖'
  if (msg.type === 'system') return '●'
  if (msg.direction === 'sent') return '→'
  return '←'
}
</script>

<template>
  <div ref="logContainer" class="h-full overflow-auto font-mono text-xs leading-relaxed py-1">
    <div v-if="!messages.length" class="flex flex-col items-center justify-center h-full gap-2 text-surface-300 dark:text-surface-600">
      <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span class="text-sm">No messages yet</span>
    </div>
    <div
      v-for="(msg, i) in messages"
      :key="i"
      class="flex gap-2 px-3 py-1 transition-colors"
      :class="rowBg(msg)"
    >
      <span class="text-surface-300 dark:text-surface-600 whitespace-nowrap select-none">{{ formatTime(msg.timestamp) }}</span>
      <span :class="msgClass(msg)" class="select-none font-bold">{{ directionIcon(msg) }}</span>
      <span class="break-all whitespace-pre-wrap text-surface-700 dark:text-surface-200">{{ msg.content }}</span>
    </div>
  </div>
</template>

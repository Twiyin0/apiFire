<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ response: Object, loading: Boolean })
const activeTab = ref('body')

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function highlightJson(str) {
  try {
    const obj = JSON.parse(str)
    const pretty = JSON.stringify(obj, null, 2)
    return pretty.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\d]*)?)/g, (match) => {
      let cls = 'json-number'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string'
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    })
  } catch {
    return escapeHtml(str)
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const statusColor = computed(() => {
  if (!props.response) return ''
  const s = props.response.status
  if (s < 300) return 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10'
  if (s < 400) return 'text-amber-600 dark:text-amber-300 bg-amber-500/10'
  return 'text-rose-600 dark:text-rose-300 bg-rose-500/10'
})

const isJson = computed(() => {
  if (!props.response) return false
  const ct = props.response.headers?.['content-type'] || ''
  return ct.includes('json') || ct.includes('javascript')
})

const displayBody = computed(() => {
  if (!props.response) return ''
  return isJson.value ? highlightJson(props.response.body) : escapeHtml(props.response.body)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Empty state -->
    <div v-if="!response && !loading" class="flex-1 flex flex-col items-center justify-center gap-3 text-surface-300 dark:text-surface-600">
      <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span class="text-sm">Send a request to see the response</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex items-center gap-3 text-blue-500 dark:text-blue-400">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-sm font-medium">Sending request...</span>
      </div>
    </div>

    <!-- Response -->
    <template v-if="response">
      <!-- Status bar -->
      <div class="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-surface-200/70 dark:border-surface-800 text-sm">
        <span :class="statusColor" class="px-2.5 py-0.5 rounded-md font-bold text-xs tracking-wide">
          {{ response.status }} {{ response.statusText }}
        </span>
        <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400 text-xs">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ response.time }}ms
        </span>
        <span class="flex items-center gap-1 text-surface-500 dark:text-surface-400 text-xs">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
          </svg>
          {{ formatSize(response.size) }}
        </span>
      </div>

      <!-- Response tabs -->
      <div class="flex-shrink-0 flex px-5 gap-1 border-b border-surface-200/70 dark:border-surface-800">
        <button
          v-for="tab in ['body', 'headers']"
          :key="tab"
          @click="activeTab = tab"
          class="relative px-4 py-2 text-sm font-medium capitalize transition-colors"
          :class="activeTab === tab
            ? 'text-blue-600 dark:text-blue-300'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'"
        >
          {{ tab }}
          <span
            v-if="activeTab === tab"
            class="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-gradient-to-r from-blue-500 to-indigo-500"
          ></span>
        </button>
      </div>

      <!-- Response content -->
      <div class="flex-1 overflow-auto p-5">
        <!-- Body -->
        <div v-if="activeTab === 'body'" class="font-mono text-sm whitespace-pre-wrap break-all leading-relaxed text-surface-800 dark:text-surface-200" v-html="displayBody"></div>

        <!-- Headers -->
        <div v-if="activeTab === 'headers'" class="space-y-1.5">
          <div v-for="(value, key) in response.headers" :key="key" class="flex gap-3 text-sm py-1.5 px-2 rounded hover:bg-surface-100/60 dark:hover:bg-surface-800/40">
            <span class="font-semibold text-surface-700 dark:text-surface-300 min-w-[200px]">{{ key }}</span>
            <span class="text-surface-600 dark:text-surface-400 break-all">{{ value }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const type = defineModel('type')
const content = defineModel('content')
const formItems = defineModel('formItems')

const bodyTypes = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form' },
  { value: 'raw', label: 'Raw' },
]

const placeholder = computed(() =>
  type.value === 'json' ? '{\n  "key": "value"\n}' : 'Enter body content...'
)

const jsonError = ref('')

function formatJson() {
  try {
    const parsed = JSON.parse(content.value)
    content.value = JSON.stringify(parsed, null, 2)
  } catch {
    jsonError.value = 'Invalid JSON'
    return
  }
  jsonError.value = ''
}

watch(content, () => { jsonError.value = '' })

function addFormRow() {
  formItems.value.push({ key: '', value: '', enabled: true })
}
function removeFormRow(i) {
  formItems.value.splice(i, 1)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Type selector -->
    <div class="flex items-center gap-3">
      <div class="inline-flex p-0.5 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/50">
        <button
          v-for="bt in bodyTypes"
          :key="bt.value"
          @click="type = bt.value"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150"
          :class="type === bt.value
            ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-soft'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'"
        >
          {{ bt.label }}
        </button>
      </div>
      <button
        v-if="type === 'json'"
        @click="formatJson"
        class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        Beautify
      </button>
      <span v-if="jsonError" class="text-xs text-rose-500 dark:text-rose-300">{{ jsonError }}</span>
    </div>

    <!-- Form: key-value editor -->
    <div v-if="type === 'form'" class="space-y-1.5">
      <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-surface-300 dark:text-surface-600 px-1 mb-1">
        <span class="w-6"></span>
        <span class="flex-1">Key</span>
        <span class="flex-1">Value</span>
        <span class="w-8"></span>
      </div>
      <div v-for="(item, i) in formItems" :key="i" class="flex items-center gap-2 group">
        <input
          type="checkbox"
          v-model="item.enabled"
          class="w-4 h-4 rounded border-surface-200 dark:border-surface-700 text-blue-500 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        />
        <input
          v-model="item.key"
          type="text"
          placeholder="Key"
          class="flex-1 h-9 px-3 rounded-md border border-surface-200 dark:border-surface-700/70 bg-white dark:bg-surface-800/40 text-sm placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
        />
        <input
          v-model="item.value"
          type="text"
          placeholder="Value"
          class="flex-1 h-9 px-3 rounded-md border border-surface-200 dark:border-surface-700/70 bg-white dark:bg-surface-800/40 text-sm font-mono placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
        />
        <button
          @click="removeFormRow(i)"
          class="w-8 h-8 flex items-center justify-center rounded-md text-surface-300 dark:text-surface-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
        >✕</button>
      </div>
      <button
        @click="addFormRow"
        class="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
      >
        <span class="text-base leading-none">+</span> Add Row
      </button>
    </div>

    <!-- JSON / Raw: textarea -->
    <textarea
      v-else-if="type !== 'none'"
      v-model="content"
      :placeholder="placeholder"
      class="w-full h-56 px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700/70 bg-white dark:bg-surface-800/40 text-sm font-mono leading-relaxed text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 resize-none transition-colors"
    ></textarea>

    <div v-else class="flex items-center justify-center h-32 rounded-lg border border-dashed border-surface-200 dark:border-surface-700/60 text-sm text-surface-400 dark:text-surface-500">
      No body content
    </div>
  </div>
</template>

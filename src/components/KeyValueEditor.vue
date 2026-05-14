<script setup>
const props = defineProps({ items: Array })

function addRow() {
  props.items.push({ key: '', value: '', enabled: true })
}

function removeRow(index) {
  props.items.splice(index, 1)
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-surface-300 dark:text-surface-600 px-1 mb-1">
      <span class="w-6"></span>
      <span class="flex-1">Key</span>
      <span class="flex-1">Value</span>
      <span class="w-8"></span>
    </div>
    <div v-for="(item, i) in items" :key="i" class="flex items-start gap-2 group">
      <input
        type="checkbox"
        v-model="item.enabled"
        class="mt-2.5 w-4 h-4 rounded border-surface-200 dark:border-surface-700 text-blue-500 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 flex-shrink-0 cursor-pointer"
      />
      <input
        v-model="item.key"
        type="text"
        placeholder="Key"
        class="flex-1 h-9 px-3 rounded-md border border-surface-200 dark:border-surface-700/70 bg-white dark:bg-surface-800/40 text-sm text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
      />
      <textarea
        v-model="item.value"
        placeholder="Value"
        rows="1"
        @input="autoResize"
        class="flex-1 min-h-[2.25rem] px-3 py-2 rounded-md border border-surface-200 dark:border-surface-700/70 bg-white dark:bg-surface-800/40 text-sm font-mono text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 resize-none overflow-hidden leading-5 transition-colors"
      />
      <button
        @click="removeRow(i)"
        class="mt-1 w-8 h-8 flex items-center justify-center rounded-md text-surface-300 dark:text-surface-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
      >✕</button>
    </div>
    <button
      @click="addRow"
      class="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
    >
      <span class="text-base leading-none">+</span> Add Row
    </button>
  </div>
</template>

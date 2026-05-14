<script setup>
import { useTheme } from '../composables/useTheme'
import { useSocket } from '../composables/useSocket'

const props = defineProps({ currentView: String })
const emit = defineEmits(['navigate'])
const { isDark, toggle } = useTheme()
const { connected, isVercel } = useSocket()

const navItems = [
  { id: 'http', label: 'HTTP', icon: '⚡' },
  { id: 'ws-client', label: 'WS Client', icon: '🔗' },
  { id: 'ws-server', label: 'WS Server', icon: '📡' },
  { id: 'tcp-client', label: 'TCP Client', icon: '🔌' },
  { id: 'tcp-server', label: 'TCP Server', icon: '🖥' },
]
</script>

<template>
  <aside class="w-60 flex-shrink-0 flex flex-col bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm border-r border-surface-200/70 dark:border-surface-800">
    <!-- Logo -->
    <div class="h-14 flex items-center px-5 border-b border-surface-200/70 dark:border-surface-800">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-soft">
          <span class="text-white text-sm font-bold">A</span>
        </div>
        <span class="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">Apifire</span>
        <span class="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 font-semibold">v1.0</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="emit('navigate', item.id)"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
        :class="currentView === item.id
          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/5 text-blue-600 dark:text-blue-300 shadow-soft'
          : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100/70 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100'"
      >
        <span
          class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-blue-500 transition-opacity"
          :class="currentView === item.id ? 'opacity-100' : 'opacity-0'"
        ></span>
        <span class="text-base leading-none">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- Bottom controls -->
    <div class="p-3 border-t border-surface-200/70 dark:border-surface-800 space-y-1">
      <!-- Connection status -->
      <div class="flex items-center gap-2 text-xs px-3 py-1.5">
        <template v-if="isVercel">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-300">Vercel</span>
          <span class="text-surface-500 dark:text-surface-400">Cloud Mode</span>
        </template>
        <template v-else>
          <span class="relative flex w-2 h-2">
            <span
              v-if="connected"
              class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"
            ></span>
            <span
              class="relative inline-flex w-2 h-2 rounded-full"
              :class="connected ? 'bg-emerald-500' : 'bg-rose-500'"
            ></span>
          </span>
          <span class="text-surface-500 dark:text-surface-400">
            {{ connected ? 'Server connected' : 'Server disconnected' }}
          </span>
        </template>
      </div>
      <!-- Theme toggle -->
      <button
        @click="toggle"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100/70 dark:hover:bg-surface-800/60 transition-colors"
      >
        <span v-if="isDark" class="text-base">☀️</span>
        <span v-else class="text-base">🌙</span>
        <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>
    </div>
  </aside>
</template>

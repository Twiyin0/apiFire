<script setup>
import { ref, reactive } from 'vue'
import KeyValueEditor from './KeyValueEditor.vue'
import BodyEditor from './BodyEditor.vue'
import ResponseViewer from './ResponseViewer.vue'
import CodeGenerator from './CodeGenerator.vue'

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const method = ref('GET')
const url = ref('')
const params = reactive([{ key: '', value: '', enabled: true }])
const headers = reactive([{ key: '', value: '', enabled: true }])
const body = ref('')
const bodyType = ref('none')
const bodyFormItems = reactive([{ key: '', value: '', enabled: true }])
const activeTab = ref('params')
const loading = ref(false)
const response = ref(null)
const error = ref('')

// Method selector keeps a fixed, neutral palette regardless of method
const methodColor = 'text-surface-700 dark:text-surface-200'
const methodBg = 'bg-surface-100 dark:bg-surface-800/60'

function buildUrl() {
  let u = url.value.trim()
  if (!u) return ''
  const activeParams = params.filter(p => p.key && p.enabled)
  if (activeParams.length) {
    const sep = u.includes('?') ? '&' : '?'
    u += sep + activeParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
  }
  return u
}

async function sendRequest() {
  const targetUrl = buildUrl()
  if (!targetUrl) { error.value = 'URL is required'; return }
  error.value = ''
  loading.value = true
  response.value = null

  try {
    const reqHeaders = {}
    headers.filter(h => h.key && h.enabled).forEach(h => { reqHeaders[h.key] = h.value })

    let reqBody = null
    if (bodyType.value !== 'none' && !['GET', 'HEAD'].includes(method.value)) {
      if (bodyType.value === 'form') {
        const pairs = bodyFormItems.filter(i => i.key && i.enabled)
        reqBody = pairs.map(i => `${encodeURIComponent(i.key)}=${encodeURIComponent(i.value)}`).join('&')
        if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      } else {
        reqBody = body.value
        if (bodyType.value === 'json' && !reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json'
        }
      }
    }

    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: method.value,
        url: targetUrl,
        headers: reqHeaders,
        body: reqBody,
      }),
    })
    const data = await res.json()
    if (data.error) {
      error.value = data.error
    } else {
      response.value = data
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- URL Bar -->
    <div class="flex-shrink-0 px-5 py-4 border-b border-surface-200/70 dark:border-surface-800 bg-white/40 dark:bg-surface-900/40">
      <div class="flex gap-2">
        <!-- Method selector -->
        <div class="relative">
          <select
            v-model="method"
            class="appearance-none h-10 pl-4 pr-9 rounded-lg border font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            :class="[methodColor, methodBg, 'border-surface-200 dark:border-surface-700']"
          >
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
          <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <!-- URL input -->
        <input
          v-model="url"
          type="text"
          placeholder="Enter request URL..."
          class="flex-1 input-base font-mono"
          @keydown.enter="sendRequest"
        />
        <!-- Send button -->
        <button
          @click="sendRequest"
          :disabled="loading"
          class="btn-primary min-w-[100px]"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Sending' : 'Send' }}
        </button>
      </div>
    </div>

    <!-- Request Tabs -->
    <div class="flex-shrink-0 border-b border-surface-200/70 dark:border-surface-800">
      <div class="flex px-5 gap-1">
        <button
          v-for="tab in ['params', 'headers', 'body', 'code']"
          :key="tab"
          @click="activeTab = tab"
          class="relative px-4 py-2.5 text-sm font-medium capitalize transition-colors"
          :class="activeTab === tab
            ? 'text-blue-600 dark:text-blue-300'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'"
        >
          {{ tab }}
          <span v-if="tab === 'params' && params.filter(p => p.key && p.enabled).length"
            class="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
            {{ params.filter(p => p.key && p.enabled).length }}
          </span>
          <span v-if="tab === 'headers' && headers.filter(h => h.key && h.enabled).length"
            class="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
            {{ headers.filter(h => h.key && h.enabled).length }}
          </span>
          <span
            v-if="activeTab === tab"
            class="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-gradient-to-r from-blue-500 to-indigo-500"
          ></span>
        </button>
      </div>
    </div>

    <!-- Request Content -->
    <div class="flex-1 overflow-auto min-h-0" :class="activeTab !== 'code' ? 'p-5' : ''">
      <KeyValueEditor v-if="activeTab === 'params'" :items="params" />
      <KeyValueEditor v-if="activeTab === 'headers'" :items="headers" />
      <BodyEditor v-if="activeTab === 'body'" v-model:type="bodyType" v-model:content="body" v-model:formItems="bodyFormItems" />
      <CodeGenerator
        v-if="activeTab === 'code'"
        :method="method"
        :url="buildUrl()"
        :headers="Object.fromEntries(headers.filter(h => h.key && h.enabled).map(h => [h.key, h.value]))"
        :body="bodyType === 'form'
          ? bodyFormItems.filter(i => i.key && i.enabled).map(i => `${encodeURIComponent(i.key)}=${encodeURIComponent(i.value)}`).join('&')
          : body"
        :bodyType="bodyType"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="flex-shrink-0 px-5 py-2.5 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-sm border-t border-rose-500/20 flex items-center gap-2">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {{ error }}
    </div>

    <!-- Response -->
    <div class="flex-shrink-0 h-[45%] border-t border-surface-200/70 dark:border-surface-800 bg-white/40 dark:bg-surface-900/40">
      <ResponseViewer :response="response" :loading="loading" />
    </div>
  </div>
</template>

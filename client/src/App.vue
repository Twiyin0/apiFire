<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import HttpRequest from './components/HttpRequest.vue'
import WsClient from './components/WsClient.vue'
import WsServer from './components/WsServer.vue'
import TcpClient from './components/TcpClient.vue'
import TcpServer from './components/TcpServer.vue'

const currentView = ref('http')

const viewMap = {
  http: HttpRequest,
  'ws-client': WsClient,
  'ws-server': WsServer,
  'tcp-client': TcpClient,
  'tcp-server': TcpServer,
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 selection:bg-blue-500/30">
    <Sidebar :currentView="currentView" @navigate="currentView = $event" />
    <main class="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-950">
      <component :is="viewMap[currentView]" />
    </main>
  </div>
</template>

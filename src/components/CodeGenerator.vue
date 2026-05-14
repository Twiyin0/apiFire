<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  method: String,
  url: String,
  headers: Object,
  body: String,
  bodyType: String,
})

const langs = [
  { id: 'nodejs', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'csharp', label: 'C#' },
  { id: 'curl', label: 'cURL' },
  { id: 'go', label: 'Go' },
]

const activeLang = ref('nodejs')
const copied = ref(false)

function headersEntries() {
  return Object.entries(props.headers || {})
}

function hasBody() {
  return props.body && !['GET', 'HEAD'].includes(props.method?.toUpperCase())
}

const code = computed(() => {
  const m = (props.method || 'GET').toUpperCase()
  const u = props.url || 'https://example.com'
  const hdrs = headersEntries()
  const body = hasBody() ? props.body : null

  switch (activeLang.value) {
    case 'nodejs': return genNodejs(m, u, hdrs, body)
    case 'python': return genPython(m, u, hdrs, body)
    case 'java':   return genJava(m, u, hdrs, body)
    case 'csharp': return genCsharp(m, u, hdrs, body)
    case 'curl':   return genCurl(m, u, hdrs, body)
    case 'go':     return genGo(m, u, hdrs, body)
    default: return ''
  }
})

function genNodejs(m, u, hdrs, body) {
  const url = `new URL('${u}')`
  const headersObj = hdrs.length
    ? `{\n${hdrs.map(([k,v]) => `    '${k}': '${v}'`).join(',\n')}\n  }`
    : '{}'
  const bodyPart = body ? `\nconst body = ${JSON.stringify(body)};\n` : ''
  const writePart = body ? '\n  req.write(body);' : ''
  return `const https = require('${u.startsWith('https') ? 'https' : 'http'}');
const url = ${url};
${bodyPart}
const options = {
  hostname: url.hostname,
  port: url.port || ${u.startsWith('https') ? '443' : '80'},
  path: url.pathname + url.search,
  method: '${m}',
  headers: ${headersObj},
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', console.error);${writePart}
req.end();`
}

function genPython(m, u, hdrs, body) {
  const headersDict = hdrs.length
    ? `{\n${hdrs.map(([k,v]) => `    "${k}": "${v}"`).join(',\n')}\n}`
    : '{}'
  const bodyPart = body ? `\nbody = ${JSON.stringify(body)}\n` : '\nbody = None\n'
  return `import urllib.request
import urllib.parse
import json

url = "${u}"
headers = ${headersDict}
${bodyPart}
data = body.encode('utf-8') if body else None
req = urllib.request.Request(url, data=data, headers=headers, method="${m}")

with urllib.request.urlopen(req) as response:
    print("Status:", response.status)
    print("Body:", response.read().decode('utf-8'))`
}

function genJava(m, u, hdrs, body) {
  const headersLines = hdrs.map(([k,v]) => `        conn.setRequestProperty("${k}", "${v}");`).join('\n')
  const bodyPart = body ? `
        conn.setDoOutput(true);
        try (java.io.OutputStream os = conn.getOutputStream()) {
            os.write(${JSON.stringify(body)}.getBytes("UTF-8"));
        }` : ''
  return `import java.net.HttpURLConnection;
import java.net.URL;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        URL url = new URL("${u}");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("${m}");
${headersLines}${bodyPart}

        int status = conn.getResponseCode();
        BufferedReader br = new BufferedReader(new InputStreamReader(
            status >= 400 ? conn.getErrorStream() : conn.getInputStream(), "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line).append("\\n");
        br.close();

        System.out.println("Status: " + status);
        System.out.println("Body: " + sb);
        conn.disconnect();
    }
}`
}

function genCsharp(m, u, hdrs, body) {
  const headersLines = hdrs.map(([k,v]) => `        client.DefaultRequestHeaders.Add("${k}", "${v}");`).join('\n')
  const bodyPart = body
    ? `        var content = new StringContent(${JSON.stringify(body)}, System.Text.Encoding.UTF8${props.bodyType === 'json' ? ', "application/json"' : ''});\n        var response = await client.${m === 'GET' ? 'GetAsync' : m === 'DELETE' ? 'DeleteAsync' : `${m[0]}${m.slice(1).toLowerCase()}Async`}("${u}"${body ? ', content' : ''});`
    : `        var response = await client.${m === 'GET' ? 'GetAsync' : m === 'DELETE' ? 'DeleteAsync' : 'GetAsync'}("${u}");`
  return `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        using var client = new HttpClient();
${headersLines}
${bodyPart}
        var body = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Status: {(int)response.StatusCode}");
        Console.WriteLine($"Body: {body}");
    }
}`
}

function genCurl(m, u, hdrs, body) {
  const hdrFlags = hdrs.map(([k,v]) => `  -H '${k}: ${v}'`).join(' \\\n')
  const bodyFlag = body ? `  -d '${body.replace(/'/g, "'\\''")}' \\` : ''
  return `curl -X ${m} '${u}' \\
${hdrFlags ? hdrFlags + ' \\\n' : ''}${bodyFlag}
  --silent --show-error`
}

function genGo(m, u, hdrs, body) {
  const headersLines = hdrs.map(([k,v]) => `\treq.Header.Set("${k}", "${v}")`).join('\n')
  const bodyPart = body
    ? `\tbody := strings.NewReader(${JSON.stringify(body)})\n\treq, err := http.NewRequest("${m}", "${u}", body)`
    : `\treq, err := http.NewRequest("${m}", "${u}", nil)`
  const importStrings = body ? '\n\t"strings"' : ''
  return `package main

import (
\t"fmt"
\t"io"
\t"net/http"${importStrings}
)

func main() {
${bodyPart}
\tif err != nil { panic(err) }
${headersLines}

\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()

\tb, _ := io.ReadAll(resp.Body)
\tfmt.Println("Status:", resp.StatusCode)
\tfmt.Println("Body:", string(b))
}`
}

async function copyCode() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Lang tabs + copy -->
    <div class="flex items-center justify-between px-5 py-2 border-b border-surface-200/70 dark:border-surface-800 flex-shrink-0">
      <div class="flex gap-1 overflow-x-auto">
        <button
          v-for="lang in langs"
          :key="lang.id"
          @click="activeLang = lang.id"
          class="px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-colors"
          :class="activeLang === lang.id
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100/60 dark:hover:bg-surface-800/60'"
        >{{ lang.label }}</button>
      </div>
      <button
        @click="copyCode"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
        :class="copied
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
          : 'bg-surface-100 dark:bg-surface-800/60 text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-700/60'"
      >
        <svg v-if="!copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/>
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <!-- Code block -->
    <div class="flex-1 overflow-auto bg-surface-50/40 dark:bg-surface-950/40">
      <pre class="text-xs font-mono leading-relaxed text-surface-700 dark:text-surface-200 whitespace-pre-wrap break-all p-5">{{ code }}</pre>
    </div>
  </div>
</template>

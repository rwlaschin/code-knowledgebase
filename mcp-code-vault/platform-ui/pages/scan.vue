<template>
  <div class="p-6 md:p-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Scan</h1>
    </div>

    <GlassCard class="mb-8">
      <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-2">Project</h2>
      <p class="text-sm text-gray-400 mb-4">Select a project to run a scan or view progress.</p>
      <select
        v-model="selectedProjectKey"
        class="block w-full max-w-sm rounded-xl border border-white/20 bg-[var(--surface-card)] px-4 py-3
               text-white placeholder:text-gray-500
               focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 focus:border-[var(--accent)]/60
               transition-colors"
        :disabled="projectsLoading"
        aria-label="Select project"
      >
        <option value="" disabled>
          {{ projectsLoading ? 'Loading…' : (projects.length ? 'Select project' : 'No projects') }}
        </option>
        <option
          v-for="p in projects"
          :key="p.key"
          :value="p.key"
        >
          {{ p.name }} ({{ p.key }})
        </option>
      </select>
      <p v-if="!projectsLoading && projects.length === 0" class="mt-3 text-sm text-amber-200/80">
        No projects in the database. Ensure the backend is running and seed has run (set <code class="px-1 rounded bg-black/30">STATS_PORT</code> to your backend port when starting the UI, e.g. <code class="px-1 rounded bg-black/30">STATS_PORT=3100 npm run dev:ui</code>).
      </p>
    </GlassCard>

    <ClientOnly>
      <GlassCard v-if="selectedProjectKey" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-2">Progress</h2>
        <ChunkUpdateGrid
          :files="scanFiles"
          :files-processed="scanProgress.filesProcessed"
          :files-updated="scanProgress.filesUpdated"
        />
      </GlassCard>
      <template #fallback>
        <GlassCard v-if="selectedProjectKey" class="mb-8">
          <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-2">Progress</h2>
          <div class="text-gray-500">Loading grid…</div>
        </GlassCard>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'

export interface ProjectItem {
  key: string
  name: string
}

export interface ScanFileEntry {
  relativePath: string
  state: 'new' | 'stale' | 'fresh'
}

export interface ScanProgressPayload {
  filesProcessed: number
  filesUpdated: number
  files?: ScanFileEntry[]
  projectKey?: string
}

const { public: publicConfig } = useRuntimeConfig()

/** Backend base URL for Socket.IO only. When useStatsProxy, same-origin so proxy handles /socket.io. */
const statsBase = computed(() => {
  if (typeof window === 'undefined') return ''
  if (publicConfig.useStatsProxy) return ''
  const raw = publicConfig.statsBaseUrl ?? ''
  const s = String(raw).trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s.replace(/\/$/, '')
  const host = (window.location.hostname === 'localhost' || window.location.hostname === '::1') ? '127.0.0.1' : window.location.hostname
  if (/^\d+$/.test(s)) return `http://${host}:${s}`
  if (s) return `http://${host}:${s}`
  return `http://${host}:3000`
})

const projects = ref<ProjectItem[]>([])
const projectsLoading = ref(true)
const selectedProjectKey = ref('')
const scanProgress = ref<ScanProgressPayload>({ filesProcessed: 0, filesUpdated: 0, files: [] })

const scanFiles = computed(() => scanProgress.value.files ?? [])

interface SocketLike {
  on(event: string, fn: (...args: unknown[]) => void): void
  disconnect(): void
}
let socket: SocketLike | null = null

async function fetchProjects() {
  projectsLoading.value = true
  try {
    const res = await fetch('/projects')
    if (res.ok) {
      const { projects: list } = await res.json()
      projects.value = list ?? []
      if (projects.value.length && !selectedProjectKey.value)
        selectedProjectKey.value = projects.value[0].key
    }
  } finally {
    projectsLoading.value = false
  }
}

async function fetchScanProgress() {
  const key = selectedProjectKey.value
  if (!key) return
  try {
    const res = await fetch(`/scan/progress?projectKey=${encodeURIComponent(key)}`)
    if (res.ok) {
      const payload = await res.json()
      scanProgress.value = payload
    }
  } catch {
    // keep previous state
  }
}

function onScanProgress(data: unknown) {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    const payload = JSON.parse(str) as ScanProgressPayload
    if (payload.projectKey && payload.projectKey !== selectedProjectKey.value) return
    scanProgress.value = payload
  } catch {
    // ignore
  }
}

watch(selectedProjectKey, (key) => {
  if (key) fetchScanProgress()
})

onMounted(async () => {
  await fetchProjects()
  if (selectedProjectKey.value) await fetchScanProgress()

  const baseUrl = statsBase.value
  const base = baseUrl ? baseUrl.replace(/\/$/, '') : ''
  if (base || publicConfig.useStatsProxy) {
    const { io } = await import('socket.io-client')
    socket = io(base || undefined, { autoConnect: true, reconnection: true })
    socket.on('scan:progress', onScanProgress)
  }
})

onUnmounted(() => {
  if (socket) socket.disconnect()
  socket = null
})
</script>

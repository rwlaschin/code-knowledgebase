<template>
  <div class="p-6 md:p-8 max-w-4xl">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Config</h1>
      <div class="flex items-center gap-3 flex-1 sm:flex-initial sm:max-w-md">
        <input
          type="text"
          placeholder="Search..."
          disabled
          class="flex-1 min-w-0 rounded-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 border border-white/10 bg-white/5 opacity-60"
          style="background-color: rgba(26, 23, 38, 0.8);"
        />
        <button
          type="button"
          disabled
          class="shrink-0 rounded-card px-4 py-2.5 text-sm font-medium text-white transition-colors opacity-60"
          style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);"
        >
          Save
        </button>
      </div>
    </div>

    <GlassCard class="mb-8">
      <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-2">Project</h2>
      <p class="text-sm text-gray-400 mb-4">Select a project to view its server-generated config.</p>
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
        <option v-for="p in projects" :key="p.key" :value="p.key">
          {{ p.name }} ({{ p.key }})
        </option>
      </select>
      <p v-if="!projectsLoading && projects.length === 0" class="mt-3 text-sm text-amber-200/80">
        No projects in the database yet. Start an MCP client and it will create the project automatically.
      </p>
    </GlassCard>

    <GlassCard class="!p-4">
      <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-2">Config</h2>
      <div v-if="configLoading" class="text-sm text-gray-500">Loading…</div>
      <pre
        v-else
        class="mt-3 text-xs text-gray-200 font-mono whitespace-pre-wrap break-all min-h-[220px]"
      >{{ configText || 'Select a project to load config.' }}</pre>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'
import { usePrimaryBaseUrl } from '../composables/usePrimaryBaseUrl'

interface ProjectItem {
  key: string
  name: string
}

const { public: publicConfig } = useRuntimeConfig()

/** Backend base URL for HTTP fetches (and optional socket connection). */
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

const configLoading = ref(false)
const configText = ref('')

interface SocketLike {
  on(event: string, fn: (...args: unknown[]) => void): void
  disconnect(): void
}
let socket: SocketLike | null = null

const primaryBaseUrl = usePrimaryBaseUrl()

async function fetchProjects() {
  projectsLoading.value = true
  const base = primaryBaseUrl.value
  if (!base) return
  try {
    const res = await fetch(`${base}/projects`)
    if (res.ok) {
      const { projects: list } = (await res.json()) as { projects?: ProjectItem[] }
      projects.value = list ?? []
      if (projects.value.length && !selectedProjectKey.value) {
        selectedProjectKey.value = projects.value[0].key
      }
    }
  } finally {
    projectsLoading.value = false
  }
}

async function fetchConfig() {
  const key = selectedProjectKey.value
  if (!key) {
    configText.value = ''
    return
  }
  const base = primaryBaseUrl.value
  if (!base) return
  configLoading.value = true
  try {
    const res = await fetch(`${base}/config?projectKey=${encodeURIComponent(key)}`)
    if (res.ok) {
      const body = (await res.json()) as { config?: string }
      configText.value = body.config ?? ''
    }
  } catch {
    // keep previous state
  } finally {
    configLoading.value = false
  }
}

watch(selectedProjectKey, () => {
  void fetchConfig()
})

async function onProjectInit() {
  await fetchProjects()
}

onMounted(async () => {
  // Seed the global primary base URL so fetches use ONLY useState afterwards.
  if (!primaryBaseUrl.value) primaryBaseUrl.value = statsBase.value

  await fetchProjects()
  if (selectedProjectKey.value) await fetchConfig()

  const baseUrl = statsBase.value
  if (baseUrl || publicConfig.useStatsProxy) {
    const { io } = await import('socket.io-client')
    socket = io(baseUrl || undefined, { autoConnect: true, reconnection: true })
    // If index.vue hasn't mounted yet, still try to publish the base we connected to.
    primaryBaseUrl.value = baseUrl || ''
    socket.on('connect', () => {
      void fetchProjects()
    })
    socket.on('project', (data: unknown) => {
      // Skip refreshes for the no-op path; perceived churn is from fetching `/projects`
      // when ensureProject returned `unchanged`.
      try {
        const str = typeof data === 'string' ? data : JSON.stringify(data)
        const payload = JSON.parse(str) as { action?: string }
        if (payload.action === 'unchanged') return
      } catch {
        // If payload shape is unexpected, refresh for safety.
      }
      void onProjectInit()
    })
  }
})

onUnmounted(() => {
  if (socket) socket.disconnect()
  socket = null
})
</script>

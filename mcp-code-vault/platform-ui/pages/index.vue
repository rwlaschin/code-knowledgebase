<template>
  <div class="p-6 md:p-8 min-w-0 max-w-full overflow-x-hidden">
    <!-- Header: Stats + connection status (heartbeat) -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Stats</h1>
      <div class="flex items-center gap-4">
        <div
          class="flex items-center gap-2 rounded-full px-4 py-2 transition-colors duration-300"
          :class="connectionStatusClass"
          :title="connectionStatusTitle"
        >
          <span
            class="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20"
            :class="connectionDotClass"
          />
          <span class="text-sm font-medium">{{ connectionStatusLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Live stream not connected (Socket.IO). Only show after we've actually had an error, not on first load. -->
    <div
      v-if="streamStatus === 'error' && hasStreamErrorOccurred"
      class="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 mb-8 text-amber-200/90"
    >
      <p class="font-medium">Live stream not connected</p>
      <p class="text-sm mt-1 opacity-90">
        The stats live stream (heartbeats, metrics) could not connect. This is <strong>not</strong> discovery — if you see "Discovery: N server(s)" below, backends registered successfully. The stream connects this page to the stats server over Socket.IO.
      </p>
      <p v-if="publicConfig.useStatsProxy" class="text-sm mt-1 opacity-90">
        The UI proxies <code class="px-1.5 py-0.5 rounded bg-black/30">/socket.io</code> to the port <code class="px-1.5 py-0.5 rounded bg-black/30">STATS_PORT</code> (default 3000). Ensure the backend is running on that port, e.g. <code class="px-1.5 py-0.5 rounded bg-black/30">PORT={{ backendPortForCopy }} npm run dev</code> in mcp-code-vault. Check the stream log below and browser Network → WS for errors.
      </p>
      <p v-else class="text-sm mt-1 opacity-90">
        Stream target: <code class="px-1.5 py-0.5 rounded bg-black/30">{{ statsBase }}</code>. Ensure the stats server is running on that port. Check the stream log below and browser Network → WS for errors.
      </p>
    </div>

    <!-- CHARTS (on top as before) -->
    <section class="mb-10 min-w-0" aria-label="Charts">
      <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-6">Charts</h2>
      <div class="flex gap-4 w-full flex-wrap min-w-0">
        <GlassCard class="mb-8 flex-[1_1_60%] min-w-0">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-white">Time series</h3>
          </div>
          <ClientOnly>
            <div class="min-w-0 w-full">
              <apexchart
                v-if="timeChartOptions"
                type="area"
                height="320"
                :options="timeChartOptions"
                :series="timeChartSeries"
              />
            </div>
            <template #fallback>
              <div class="h-[320px] flex items-center justify-center text-gray-500">Loading chart…</div>
            </template>
          </ClientOnly>
        </GlassCard>
        <GlassCard class="mb-8 flex-[1_1_min(280px,100%)] min-w-0">
          <div class="mb-6">
            <h3 class="text-xl font-bold text-white">Requests per minute</h3>
          </div>
          <ClientOnly>
            <div class="min-w-0 w-full">
              <apexchart
                v-if="rpmChartOptions"
                type="bar"
                height="280"
                :options="rpmChartOptions"
                :series="rpmChartSeries"
              />
            </div>
            <template #fallback>
              <div class="h-[280px] flex items-center justify-center text-gray-500">Loading chart…</div>
            </template>
          </ClientOnly>
        </GlassCard>
      </div>
    </section>

    <!-- Scorecards: Queries, Documents returned, Files read, Tool calls, Errors, Cache hit rate, Scan progress -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      <GlassCard v-for="stat in mcpScorecards" :key="stat.label" class="!p-4">
        <p class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">{{ stat.label }}</p>
        <p class="text-xl md:text-2xl font-bold text-white mt-1 tabular-nums">{{ stat.value }}</p>
        <p v-if="stat.sublabel" class="text-xs text-gray-500 mt-0.5">{{ stat.sublabel }}</p>
      </GlassCard>
      <GlassCard class="!p-4">
        <p class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">Files processed</p>
        <p class="text-xl md:text-2xl font-bold text-white mt-1 tabular-nums">{{ scanFilesProcessedDisplay }}</p>
      </GlassCard>
      <GlassCard class="!p-4">
        <p class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">Files updated</p>
        <p class="text-xl md:text-2xl font-bold text-white mt-1 tabular-nums">{{ scanFilesUpdatedDisplay }}</p>
      </GlassCard>
    </div>

    <!-- Response time & token percentiles -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <GlassCard>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Response time (ms)</p>
        <div class="flex flex-wrap gap-4">
          <div><span class="text-gray-500 text-sm">p50</span><span class="ml-2 font-mono font-bold text-white">{{ stats.responseTimeP50 }}</span></div>
          <div><span class="text-gray-500 text-sm">p85</span><span class="ml-2 font-mono font-bold text-white">{{ stats.responseTimeP85 }}</span></div>
          <div><span class="text-gray-500 text-sm">p99</span><span class="ml-2 font-mono font-bold text-white">{{ stats.responseTimeP99 }}</span></div>
        </div>
      </GlassCard>
      <GlassCard>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tokens in</p>
        <div class="flex flex-wrap gap-4">
          <div><span class="text-gray-500 text-sm">p50</span><span class="ml-2 font-mono font-bold text-white">{{ stats.tokensInP50 }}</span></div>
          <div><span class="text-gray-500 text-sm">p85</span><span class="ml-2 font-mono font-bold text-white">{{ stats.tokensInP85 }}</span></div>
          <div><span class="text-gray-500 text-sm">p99</span><span class="ml-2 font-mono font-bold text-white">{{ stats.tokensInP99 }}</span></div>
        </div>
      </GlassCard>
      <GlassCard>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tokens out</p>
        <div class="flex flex-wrap gap-4">
          <div><span class="text-gray-500 text-sm">p50</span><span class="ml-2 font-mono font-bold text-white">{{ stats.tokensOutP50 }}</span></div>
          <div><span class="text-gray-500 text-sm">p85</span><span class="ml-2 font-mono font-bold text-white">{{ stats.tokensOutP85 }}</span></div>
          <div><span class="text-gray-500 text-sm">p99</span><span class="ml-2 font-mono font-bold text-white">{{ stats.tokensOutP99 }}</span></div>
        </div>
      </GlassCard>
    </div>

    <!-- Registered backends (discovery): poll so we show when MCPs register. -->
    <ClientOnly>
      <section class="mb-6" aria-label="Registered backends">
        <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-2">Registered backends</h2>
        <p class="text-sm text-gray-400">
          <span v-if="discoveryServers.length === 0">No backends registered yet. They register when they receive the UI broadcast on UDP 9255.</span>
          <span v-else>{{ discoveryServers.length }} server(s): {{ discoveryServers.map((s) => `${s.projectName}:${s.port}`).join(', ') }}</span>
        </p>
      </section>
    </ClientOnly>

    <!-- Stream event log (heartbeat, connected, metric). ClientOnly to avoid hydration mismatch: server has no socket data. -->
    <ClientOnly>
      <section class="mb-8" aria-label="Stream event log">
        <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-4">Stream event log</h2>
        <GlassCard class="!p-0 overflow-hidden flex flex-col max-h-[320px]">
          <div class="overflow-y-auto min-h-0 flex-1">
            <table class="w-full text-left text-sm">
              <thead class="sticky top-0 z-10 bg-[#1A1726] border-b border-white/10">
                <tr>
                  <th class="px-4 py-3 font-medium text-gray-400">Event</th>
                  <th class="px-4 py-3 font-medium text-gray-400">Time</th>
                  <th class="px-4 py-3 font-medium text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody class="text-gray-300">
              <tr v-if="streamEventRows.length === 0" class="border-b border-white/5">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500">No events yet. Backend sends connected, heartbeat, and metric over Socket.IO.</td>
              </tr>
              <tr
                v-for="(row, i) in streamEventRows"
                :key="i"
                class="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="row.event === 'connected' ? 'bg-emerald-500/30 text-emerald-200' : row.event === 'heartbeat' ? 'bg-violet-500/30 text-violet-200' : 'bg-white/10 text-gray-200'"
                  >
                    {{ row.event }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-400">{{ row.time }}</td>
                <td class="px-4 py-3 font-mono text-xs truncate max-w-[200px]">{{ row.data }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
        <!-- Browser logs: same as console [stream] messages -->
        <div class="mt-4 p-3 rounded-lg bg-black/30 border border-white/10">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Browser logs (Socket.IO)</p>
          <pre class="text-xs text-gray-400 font-mono overflow-auto max-h-32 whitespace-pre-wrap break-all">{{ streamBrowserLogs }}</pre>
        </div>
      </section>
      <template #fallback>
        <section class="mb-8" aria-label="Stream event log">
          <h2 class="text-lg font-semibold text-gray-400 uppercase tracking-widest mb-4">Stream event log</h2>
          <GlassCard class="!p-0 overflow-hidden flex flex-col max-h-[320px]">
            <div class="overflow-y-auto min-h-0 flex-1">
              <table class="w-full text-left text-sm">
                <thead class="sticky top-0 z-10 bg-[#1A1726] border-b border-white/10">
                  <tr>
                    <th class="px-4 py-3 font-medium text-gray-400">Event</th>
                    <th class="px-4 py-3 font-medium text-gray-400">Time</th>
                    <th class="px-4 py-3 font-medium text-gray-400">Data</th>
                  </tr>
                </thead>
                <tbody class="text-gray-300">
                  <tr class="border-b border-white/5">
                    <td colspan="3" class="px-4 py-6 text-center text-gray-500">No events yet. Backend sends connected, heartbeat, and metric over Socket.IO.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>
          <div class="mt-4 p-3 rounded-lg bg-black/30 border border-white/10">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Browser logs (Socket.IO)</p>
            <pre class="text-xs text-gray-400 font-mono overflow-auto max-h-32 whitespace-pre-wrap break-all"></pre>
          </div>
        </section>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'
import type { ApexOptions } from 'apexcharts'

/** Socket type from dynamic import (client-only). */
interface SocketLike {
  on(event: string, fn: (...args: unknown[]) => void): void
  disconnect(): void
}

const { public: publicConfig } = useRuntimeConfig()
/** Backend base URL for Socket.IO only. When useStatsProxy, same-origin so proxy handles /socket.io. */
const statsBase = computed(() => {
  if (typeof window === 'undefined') return ''
  if (publicConfig.useStatsProxy) return ''
  const raw = publicConfig.statsBaseUrl ?? ''
  const s = String(raw).trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s.replace(/\/$/, '')
  // Use 127.0.0.1 so browser hits IPv4; backend listens on 0.0.0.0 and localhost can resolve to ::1
  const host = (window.location.hostname === 'localhost' || window.location.hostname === '::1') ? '127.0.0.1' : window.location.hostname
  if (/^\d+$/.test(s)) return `http://${host}:${s}`
  if (s) return `http://${host}:${s}`
  return `http://${host}:3000`
})
/** Port from statsBase for error copy (e.g. 3000). When using proxy we don't have a URL so show default. */
const backendPortForCopy = computed(() => {
  const b = statsBase.value
  if (!b) return '3000'
  try {
    const u = new URL(b)
    return u.port || (u.protocol === 'https:' ? '443' : '80')
  } catch {
    return '3000'
  }
})

const streamStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const streamEventTime = ref('')
const streamEventRows = ref<{ event: string; time: string; data: string }[]>([])
/** Browser logs visible on the page (same as console [stream] messages). */
const streamBrowserLogs = ref('')
/** Only show Connected after we get a heartbeat (proves backend stream is alive). */
const hasReceivedHeartbeat = ref(false)
/** Only show the stream error banner after we've actually had a connect_error or disconnect (not on first paint). */
const hasStreamErrorOccurred = ref(false)

/** Registered backends (discovery); polled so list updates when MCPs register. */
const discoveryServers = ref<{ projectName: string; port: number }[]>([])
let discoveryPollTimer: ReturnType<typeof setInterval> | null = null

async function fetchDiscoveryServers() {
  try {
    const r = await fetch('/api/servers')
    if (r.ok) {
      const { servers } = (await r.json()) as { servers?: { projectName: string; port: number }[] }
      discoveryServers.value = servers ?? []
    }
  } catch {
    discoveryServers.value = []
  }
}

function addStreamLog(msg: string) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`
  console.log('[stream]', msg)
  streamBrowserLogs.value = streamBrowserLogs.value ? `${streamBrowserLogs.value}\n${line}` : line
  if (streamBrowserLogs.value.length > 4000) streamBrowserLogs.value = streamBrowserLogs.value.slice(-3500)
}

// Scan progress: from GET /scan/progress on mount and scan:progress socket events
const scanFilesProcessed = ref<number | null>(null)
const scanFilesUpdated = ref<number | null>(null)
const scanFilesProcessedDisplay = computed(() =>
  scanFilesProcessed.value != null ? String(scanFilesProcessed.value) : '—'
)
const scanFilesUpdatedDisplay = computed(() =>
  scanFilesUpdated.value != null ? String(scanFilesUpdated.value) : '—'
)

// Metrics: initial load from Mongo on connect, then live from stream
interface StreamMetric {
  _id?: string
  instance_id: string
  operation: string
  started_at: string
  ended_at: string
  duration_ms: number
  status: 'ok' | 'error'
  error_code?: string
  metadata?: Record<string, unknown>
}
const metricsFromStream = ref<StreamMetric[]>([])
const metricsLoading = ref(false)

// Connection status (heartbeat: last update tooltip)
const connectionStatusLabel = computed(() => {
  if (streamStatus.value === 'connected') return 'Connected'
  if (streamStatus.value === 'connecting') return 'Waiting…'
  if (streamStatus.value === 'error') return 'Disconnected'
  return 'Waiting…'
})
const connectionStatusTitle = computed(() => {
  if (streamStatus.value === 'connected' && streamEventTime.value)
    return `Last update: ${streamEventTime.value}`
  if (streamStatus.value === 'connecting') return 'Connecting to backend…'
  return ''
})
const connectionStatusClass = computed(() => {
  if (streamStatus.value === 'connected') return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
  if (streamStatus.value === 'connecting' || streamStatus.value === 'disconnected') return 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
  return 'bg-gray-500/15 text-gray-400 border border-white/10'
})
const connectionDotClass = computed(() => {
  if (streamStatus.value === 'connected') return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
  if (streamStatus.value === 'connecting' || streamStatus.value === 'disconnected') return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
  return 'bg-gray-500'
})

// Scorecards and stats derived only from streamed metrics (no fake data)
const mcpScorecards = computed(() => {
  const m = metricsFromStream.value
  const queries = m.filter((x) => x.operation === 'query').length
  const docsReturned = m.reduce((sum, x) => sum + (Number((x.metadata as { documents?: number })?.documents) || 0), 0)
  const filesRead = m.filter((x) => x.operation?.toLowerCase().includes('file') || x.operation === 'get_file_summary').length
  const toolCalls = m.filter((x) => x.operation?.toLowerCase().includes('tool') || x.operation === 'tool_call').length
  const errors = m.filter((x) => x.status === 'error').length
  const cacheHits = m.reduce((sum, x) => sum + (Number((x.metadata as { cache_hit?: number })?.cache_hit) || 0), 0)
  const totalWithCache = m.length
  const cacheRate = totalWithCache > 0 ? Math.round((cacheHits / totalWithCache) * 100) : null
  return [
    { label: 'Queries', value: m.length > 0 ? String(queries) : '—', sublabel: 'Total' },
    { label: 'Documents returned', value: m.length > 0 ? String(docsReturned) : '—', sublabel: '' },
    { label: 'Files read', value: m.length > 0 ? String(filesRead) : '—', sublabel: '' },
    { label: 'Tool calls', value: m.length > 0 ? String(toolCalls) : '—', sublabel: '' },
    { label: 'Errors', value: m.length > 0 ? String(errors) : '—', sublabel: '' },
    { label: 'Cache hit rate', value: cacheRate != null ? `${cacheRate}` : '—', sublabel: '%' }
  ]
})

const stats = reactive({
  responseTimeP50: '—',
  responseTimeP85: '—',
  responseTimeP99: '—',
  tokensInP50: '—',
  tokensInP85: '—',
  tokensInP99: '—',
  tokensOutP50: '—',
  tokensOutP85: '—',
  tokensOutP99: '—'
})

function updateStatsFromStream() {
  const m = metricsFromStream.value
  if (m.length === 0) return
  const durations = m.map((x) => x.duration_ms).sort((a, b) => a - b)
  const p = (q: number) => durations[Math.floor((q / 100) * durations.length)] ?? durations[durations.length - 1]
  stats.responseTimeP50 = String(Math.round(p(50)))
  stats.responseTimeP85 = String(Math.round(p(85)))
  stats.responseTimeP99 = String(Math.round(p(99)))
  const tokensIn = m.map((x) => Number((x.metadata as { tokens_in?: number })?.tokens_in) ?? 0).filter(Boolean)
  const tokensOut = m.map((x) => Number((x.metadata as { tokens_out?: number })?.tokens_out) ?? 0).filter(Boolean)
  if (tokensIn.length) {
    const sorted = [...tokensIn].sort((a, b) => a - b)
    const pct = (q: number) => sorted[Math.floor((q / 100) * sorted.length)] ?? sorted[sorted.length - 1]
    stats.tokensInP50 = String(pct(50))
    stats.tokensInP85 = String(pct(85))
    stats.tokensInP99 = String(pct(99))
  }
  if (tokensOut.length) {
    const sorted = [...tokensOut].sort((a, b) => a - b)
    const pct = (q: number) => sorted[Math.floor((q / 100) * sorted.length)] ?? sorted[sorted.length - 1]
    stats.tokensOutP50 = String(pct(50))
    stats.tokensOutP85 = String(pct(85))
    stats.tokensOutP99 = String(pct(99))
  }
}

// Charts: data only from stream (no fake series)
const last7Days = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
)
const timeChartSeries = computed(() => {
  const m = metricsFromStream.value
  const isQuery = (x: { operation: string }) => x.operation === 'query'
  const byDay = last7Days.value.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d)
    dayEnd.setDate(dayEnd.getDate() + 1)
    return m.filter((x) => {
      const t = new Date(x.started_at).getTime()
      return t >= d.getTime() && t < dayEnd.getTime()
    }).length
  })
  const byDayQueries = last7Days.value.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d)
    dayEnd.setDate(dayEnd.getDate() + 1)
    return m.filter((x) => {
      if (!isQuery(x)) return false
      const t = new Date(x.started_at).getTime()
      return t >= d.getTime() && t < dayEnd.getTime()
    }).length
  })
  return [
    { name: 'Active projects', data: byDay.map(() => 0) },
    { name: 'Event count', data: byDay },
    { name: 'File refreshes', data: byDay.map(() => 0) },
    { name: 'Queries', data: byDayQueries }
  ]
})
const timeChartOptions = ref<ApexOptions | null>({
  chart: { type: 'area', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
  theme: { mode: 'dark' },
  colors: ['#8B5CF6', '#3B82F6', '#EC4899', '#F97316'],
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.04, shadeIntensity: 1 } },
  dataLabels: { enabled: false },
  xaxis: { categories: last7Days.value, labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { color: 'rgba(255,255,255,0.08)' } },
  yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { show: false } },
  grid: { borderColor: 'rgba(255,255,255,0.06)', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  legend: { labels: { colors: '#E5E7EB' }, position: 'top', horizontalAlign: 'right', fontSize: '12px' },
  tooltip: { theme: 'dark', x: { format: 'dd MMM' } }
})

const rpmCategories = Array.from({ length: 12 }, (_, i) => `${i * 2}:00`)
const rpmChartSeries = computed(() => {
  const m = metricsFromStream.value
  const now = new Date()
  const buckets = rpmCategories.map((_, i) => {
    const hour = i * 2
    const start = new Date(now)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 2, 0, 0, 0)
    return m.filter((x) => {
      const t = new Date(x.started_at).getTime()
      return t >= start.getTime() && t < end.getTime()
    }).length
  })
  return [{ name: 'Requests/min', data: buckets }]
})
const rpmChartOptions = ref<ApexOptions | null>({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit' },
  theme: { mode: 'dark' },
  colors: ['#8B5CF6'],
  plotOptions: { bar: { borderRadius: 8, columnWidth: '65%', distributed: false } },
  dataLabels: { enabled: false },
  xaxis: { categories: rpmCategories, labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { color: 'rgba(255,255,255,0.08)' } },
  yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { show: false } },
  grid: { borderColor: 'rgba(255,255,255,0.06)' },
  legend: { show: false },
  tooltip: { theme: 'dark' }
})

function pushStreamEvent(data: string, eventType: string) {
  streamEventTime.value = new Date().toLocaleString()
  streamEventRows.value = [
    { event: eventType, time: new Date().toLocaleString(), data: data.slice(0, 120) },
    ...streamEventRows.value.slice(0, 49)
  ]
}

async function fetchInitialMetrics() {
  metricsLoading.value = true
  try {
    const res = await fetch('/metrics?limit=500')
    if (res.ok) {
      const { metrics } = await res.json()
      const list = (metrics ?? []).map((m: { _id?: string; started_at: string; ended_at: string; [k: string]: unknown }) => ({
        _id: m._id?.toString?.() ?? (m as { id?: string }).id,
        instance_id: m.instance_id as string,
        operation: m.operation as string,
        started_at: typeof m.started_at === 'string' ? m.started_at : new Date(m.started_at).toISOString(),
        ended_at: typeof m.ended_at === 'string' ? m.ended_at : new Date(m.ended_at).toISOString(),
        duration_ms: m.duration_ms as number,
        status: m.status as 'ok' | 'error',
        error_code: m.error_code as string | undefined,
        metadata: m.metadata as Record<string, unknown> | undefined
      }))
      metricsFromStream.value = list
      updateStatsFromStream()
    }
  } catch {
    metricsFromStream.value = []
  } finally {
    metricsLoading.value = false
  }
}

function onMetric(data: string) {
  try {
    const m = JSON.parse(data) as StreamMetric
    const id = m._id ?? (m as { id?: string }).id
    const existing = metricsFromStream.value
    if (id && existing.some((x) => (x._id ?? (x as { id?: string }).id) === id)) return
    metricsFromStream.value = [m, ...existing.slice(0, 498)]
    updateStatsFromStream()
  } catch {
    // ignore
  }
}

let socket: SocketLike | null = null
/** Backend sends heartbeat every 5s; if we get nothing for 15s, connection is dead. */
const STREAM_DEAD_MS = 15_000
let streamDeadTimer: ReturnType<typeof setTimeout> | null = null

function scheduleStreamDeadCheck() {
  if (streamDeadTimer) clearTimeout(streamDeadTimer)
  streamDeadTimer = setTimeout(() => {
    streamDeadTimer = null
    if (streamStatus.value === 'connected') {
      streamStatus.value = 'error'
      hasReceivedHeartbeat.value = false
      if (socket) socket.disconnect()
      socket = null
    }
  }, STREAM_DEAD_MS)
}

function onStreamEvent() {
  if (streamStatus.value === 'connected') scheduleStreamDeadCheck()
}

onMounted(async () => {
  await fetchDiscoveryServers()
  discoveryPollTimer = setInterval(fetchDiscoveryServers, 5000)

  const baseUrl = statsBase.value
  if (!baseUrl && !publicConfig.useStatsProxy) {
    addStreamLog('No stats URL (set NUXT_PUBLIC_UI_PORT or use localhost). Socket.IO not started.')
    streamStatus.value = 'error'
    return
  }
  streamStatus.value = 'connecting'
  hasReceivedHeartbeat.value = false
  const base = baseUrl ? baseUrl.replace(/\/$/, '') : ''
  const { io } = await import('socket.io-client')
  addStreamLog(`Socket.IO connecting to ${base || window.location.origin}`)
  socket = io(base || undefined, { autoConnect: true, reconnection: true })
  socket.on('connect', () => {
    addStreamLog('Socket.IO connect')
    streamStatus.value = 'connecting'
  })
  socket.on('connect_error', (err: Error) => {
    hasStreamErrorOccurred.value = true
    addStreamLog(`Socket.IO connect_error: ${err.message}. ${base ? `Is the backend running on ${base}?` : 'Is the stats server running? (STATS_PORT)'}`)
    streamStatus.value = 'error'
    hasReceivedHeartbeat.value = false
  })
  socket.on('disconnect', (reason: string) => {
    hasStreamErrorOccurred.value = true
    addStreamLog(`Socket.IO disconnect: ${reason}`)
    if (streamDeadTimer) clearTimeout(streamDeadTimer)
    streamDeadTimer = null
    streamStatus.value = 'error'
    hasReceivedHeartbeat.value = false
  })
  socket.on('connected', (data: unknown) => {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    addStreamLog(`event=connected ${str.slice(0, 80)}`)
    pushStreamEvent(str, 'connected')
    fetchInitialMetrics()
  })
  socket.on('heartbeat', (data: unknown) => {
    if (!hasReceivedHeartbeat.value) {
      hasReceivedHeartbeat.value = true
      streamStatus.value = 'connected'
      scheduleStreamDeadCheck()
    } else {
      onStreamEvent()
    }
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    addStreamLog(`event=heartbeat ${str.slice(0, 60)}`)
    pushStreamEvent(str, 'heartbeat')
  })
  socket.on('metric', (data: unknown) => {
    onStreamEvent()
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    addStreamLog(`event=metric ${str.slice(0, 80)}`)
    pushStreamEvent(str, 'metric')
    onMetric(str)
  })
  socket.on('scan:progress', (data: unknown) => {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data)
      const payload = JSON.parse(str) as { filesProcessed?: number; filesUpdated?: number }
      if (typeof payload.filesProcessed === 'number') scanFilesProcessed.value = payload.filesProcessed
      if (typeof payload.filesUpdated === 'number') scanFilesUpdated.value = payload.filesUpdated
    } catch {
      // ignore
    }
  })
  fetchScanProgress()
})

async function fetchScanProgress() {
  try {
    const res = await fetch('/scan/progress')
    if (res.ok) {
      const payload = (await res.json()) as { filesProcessed?: number; filesUpdated?: number }
      if (typeof payload.filesProcessed === 'number') scanFilesProcessed.value = payload.filesProcessed
      if (typeof payload.filesUpdated === 'number') scanFilesUpdated.value = payload.filesUpdated
    }
  } catch {
    // keep previous state
  }
}

onUnmounted(() => {
  if (discoveryPollTimer) clearInterval(discoveryPollTimer)
  discoveryPollTimer = null
  if (streamDeadTimer) clearTimeout(streamDeadTimer)
  streamDeadTimer = null
  if (socket) socket.disconnect()
  socket = null
})
</script>

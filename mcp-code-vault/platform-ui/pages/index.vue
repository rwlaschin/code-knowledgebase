<template>
  <div class="p-6 md:p-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Stats</h1>
      <div class="flex items-center gap-4">
        <!-- Connection status: green (connected + hover = last update), yellow (waiting) -->
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
        <button
          type="button"
          class="shrink-0 rounded-card px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
          style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);"
          @click="refreshStats"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Connection error message -->
    <div
      v-if="streamStatus === 'error'"
      class="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 mb-8 text-amber-200/90"
    >
      <p class="font-medium">Backend not connected</p>
      <p class="text-sm mt-1 opacity-90">
        Run <code class="px-1.5 py-0.5 rounded bg-black/30">npm run dev</code> from
        <code class="px-1.5 py-0.5 rounded bg-black/30">mcp-code-vault</code> root (port 3000). Set
        <code class="px-1.5 py-0.5 rounded bg-black/30">STATS_PORT</code> if different.
      </p>
    </div>

    <!-- Chart 1: Time series - Active projects, Event Count, File Refreshes, Queries -->
    <GlassCard class="mb-8">
      <div class="mb-6">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">MCP activity</p>
        <h2 class="text-xl font-bold text-white">Time series</h2>
        <p class="text-sm text-gray-500 mt-0.5">Active projects, Event count, File refreshes, Queries</p>
      </div>
      <ClientOnly>
        <apexchart
          v-if="timeChartOptions"
          type="area"
          height="320"
          :options="timeChartOptions"
          :series="timeChartSeries"
        />
        <template #fallback>
          <div class="h-[320px] flex items-center justify-center text-gray-500">Loading chart…</div>
        </template>
      </ClientOnly>
    </GlassCard>

    <!-- Chart 2: Bar - Requests Per Minute -->
    <GlassCard class="mb-8">
      <div class="mb-6">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Throughput</p>
        <h2 class="text-xl font-bold text-white">Requests per minute</h2>
      </div>
      <ClientOnly>
        <apexchart
          v-if="rpmChartOptions"
          type="bar"
          height="280"
          :options="rpmChartOptions"
          :series="rpmChartSeries"
        />
        <template #fallback>
          <div class="h-[280px] flex items-center justify-center text-gray-500">Loading chart…</div>
        </template>
      </ClientOnly>
    </GlassCard>

    <!-- MCP stats scorecards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      <GlassCard v-for="stat in mcpScorecards" :key="stat.label" class="!p-4">
        <p class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">{{ stat.label }}</p>
        <p class="text-xl md:text-2xl font-bold text-white mt-1 tabular-nums">{{ stat.value }}</p>
        <p v-if="stat.sublabel" class="text-xs text-gray-500 mt-0.5">{{ stat.sublabel }}</p>
      </GlassCard>
    </div>

    <!-- Response time & token percentiles row -->
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

    <!-- Most used commands -->
    <GlassCard class="mb-8">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Most used commands</p>
      <div class="flex flex-wrap gap-3">
        <span
          v-for="(count, cmd) in stats.mostUsedCommands"
          :key="cmd"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium bg-white/10 text-gray-200 border border-white/10"
        >
          <span class="text-accent font-mono">{{ cmd }}</span>
          <span class="text-gray-500 tabular-nums">{{ count }}</span>
        </span>
        <span v-if="Object.keys(stats.mostUsedCommands).length === 0" class="text-gray-500 text-sm">No data yet</span>
      </div>
    </GlassCard>

    <!-- Stream event log -->
    <div>
      <h2 class="text-lg font-bold text-white mb-4">Stream event log</h2>
      <GlassCard class="!p-0 overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-white/10">
              <th class="px-4 py-3 font-medium text-gray-400">Event</th>
              <th class="px-4 py-3 font-medium text-gray-400">Time</th>
              <th class="px-4 py-3 font-medium text-gray-400">Data</th>
            </tr>
          </thead>
          <tbody class="text-gray-300">
            <tr v-if="!lastStreamEvent" class="border-b border-white/5">
              <td colspan="3" class="px-4 py-6 text-center text-gray-500">No events yet. Connect the backend to see the stream.</td>
            </tr>
            <tr v-else class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :style="streamEventType === 'connected' ? 'background-color: rgba(34, 197, 94, 0.3); color: #86EFAC;' : 'background-color: rgba(139, 92, 246, 0.3); color: #C4B5FD;'"
                >
                  {{ streamEventType || 'message' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-400">{{ streamEventTime }}</td>
              <td class="px-4 py-3 font-mono text-xs truncate max-w-[200px]">{{ lastStreamEvent }}</td>
            </tr>
          </tbody>
        </table>
      </GlassCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import type { ApexOptions } from 'apexcharts'

const streamStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const lastStreamEvent = ref('')
const streamEventTime = ref('')
const streamEventType = ref('')

// Connection status: green when connected (hover = last update), yellow when waiting
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

// MCP stats (mock; replace with API when backend provides)
const stats = reactive({
  responseTimeP50: '—',
  responseTimeP85: '—',
  responseTimeP99: '—',
  tokensInP50: '—',
  tokensInP85: '—',
  tokensInP99: '—',
  tokensOutP50: '—',
  tokensOutP85: '—',
  tokensOutP99: '—',
  mostUsedCommands: {} as Record<string, number>
})

const mcpScorecards = computed(() => [
  { label: 'Queries', value: '—', sublabel: 'Total' },
  { label: 'Documents returned', value: '—', sublabel: '' },
  { label: 'Files read', value: '—', sublabel: '' },
  { label: 'Tool calls', value: '—', sublabel: '' },
  { label: 'Errors', value: '—', sublabel: '' },
  { label: 'Cache hit rate', value: '—', sublabel: '%' }
])

// Chart 1: Time series (mock last 7 days)
const last7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})
const timeChartSeries = ref([
  { name: 'Active projects', data: [2, 3, 2, 4, 3, 4, 3] },
  { name: 'Event count', data: [120, 180, 150, 220, 190, 240, 210] },
  { name: 'File refreshes', data: [45, 62, 58, 70, 65, 78, 72] },
  { name: 'Queries', data: [88, 110, 95, 130, 115, 140, 125] }
])
const timeChartOptions = ref<ApexOptions | null>({
  chart: { type: 'area', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
  theme: { mode: 'dark' },
  colors: ['#8B5CF6', '#3B82F6', '#EC4899', '#F97316'],
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.04, shadeIntensity: 1 } },
  dataLabels: { enabled: false },
  xaxis: { categories: last7Days, labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { color: 'rgba(255,255,255,0.08)' } },
  yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { show: false }, grid: { borderColor: 'rgba(255,255,255,0.06)' } },
  grid: { borderColor: 'rgba(255,255,255,0.06)', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  legend: { labels: { colors: '#E5E7EB' }, position: 'top', horizontalAlign: 'right', fontSize: '12px' },
  tooltip: { theme: 'dark', x: { format: 'dd MMM' } }
})

// Chart 2: Requests per minute (mock)
const rpmCategories = Array.from({ length: 12 }, (_, i) => `${i * 2}:00`)
const rpmChartSeries = ref([{ name: 'Requests/min', data: [12, 18, 14, 22, 19, 25, 21, 28, 24, 20, 16, 14] }])
const rpmChartOptions = ref<ApexOptions | null>({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit' },
  theme: { mode: 'dark' },
  colors: ['#8B5CF6'],
  plotOptions: { bar: { borderRadius: 8, columnWidth: '65%', distributed: false } },
  dataLabels: { enabled: false },
  xaxis: { categories: rpmCategories, labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { color: 'rgba(255,255,255,0.08)' } },
  yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }, axisBorder: { show: false }, grid: { borderColor: 'rgba(255,255,255,0.06)' } },
  grid: { borderColor: 'rgba(255,255,255,0.06)' },
  legend: { show: false },
  tooltip: { theme: 'dark' }
})

function pushStreamEvent(data: string, eventType: string) {
  lastStreamEvent.value = data
  streamEventTime.value = new Date().toLocaleTimeString()
  streamEventType.value = eventType
}

function refreshStats() {
  // Placeholder: in real app, refetch stats API
}

onMounted(() => {
  streamStatus.value = 'connecting'
  const es = new EventSource('/metrics/stream')
  es.onopen = () => { streamStatus.value = 'connected' }
  es.addEventListener('connected', (e) => pushStreamEvent(e.data ?? '', 'connected'))
  es.addEventListener('heartbeat', (e) => pushStreamEvent(e.data ?? '', 'heartbeat'))
  es.onmessage = (e) => pushStreamEvent(e.data ?? '', 'message')
  es.onerror = () => { streamStatus.value = 'error' }
})
</script>

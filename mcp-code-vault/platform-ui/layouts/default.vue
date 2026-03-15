<template>
  <div class="h-screen flex overflow-hidden text-gray-100 bg-[#100B1A] relative">
    <!-- Background light that tracks the mouse (soft spotlight) -->
    <div
      class="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      :style="backgroundLightStyle"
    />
    <!-- Sidebar: match reference (narrow, logo, hamburger, nav with rounded active state) -->
    <aside class="w-[240px] shrink-0 flex flex-col min-h-0 border-r border-white/5 bg-[#0f0b14] relative z-10 overflow-y-auto">
      <div class="p-4 flex items-center gap-3 border-b border-white/5">
        <!-- Logo area: stylized icon placeholder (reference has purple bird-like icon) -->
        <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-accent to-chart-pink shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
        </div>
        <button type="button" class="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors" aria-label="Menu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      <nav class="p-3 flex flex-col gap-0.5 flex-1">
        <NuxtLink
          to="/"
          class="rounded-card px-3 py-2.5 flex items-center gap-3 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          active-class="!bg-[#1A1726] !text-white"
        >
          <span class="w-5 h-5 flex items-center justify-center shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></span>
          Stats
        </NuxtLink>
        <NuxtLink
          to="/config"
          class="rounded-card px-3 py-2.5 flex items-center gap-3 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          active-class="!bg-[#1A1726] !text-white"
        >
          <span class="w-5 h-5 flex items-center justify-center shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></span>
          Config
        </NuxtLink>
        <NuxtLink
          to="/scan"
          class="rounded-card px-3 py-2.5 flex items-center gap-3 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          active-class="!bg-[#1A1726] !text-white"
        >
          <span class="w-5 h-5 flex items-center justify-center shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
          Scan
        </NuxtLink>
        <NuxtLink
          to="/docs"
          class="rounded-card px-3 py-2.5 flex items-center gap-3 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          active-class="!bg-[#1A1726] !text-white"
        >
          <span class="w-5 h-5 flex items-center justify-center shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></span>
          Docs
        </NuxtLink>
        <template v-if="route.path === '/docs'">
          <div class="pl-8 pr-2 py-1 flex flex-col gap-0.5">
            <a
              v-for="s in docSections"
              :key="s.id"
              :href="`#${s.id}`"
              class="rounded-card px-2.5 py-1.5 text-sm transition-colors"
              :class="docsActiveSectionId === s.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'"
              @click.prevent="scrollToDocSection(s.id)"
            >
              {{ s.label }}
            </a>
          </div>
        </template>
      </nav>
    </aside>
    <main class="flex-1 min-h-0 overflow-auto min-w-0 relative z-10 scroll-smooth">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const docSections = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'setting-up-mcp-cursor', label: 'Setting up the MCP server in Cursor' },
  { id: 'using-the-mcp', label: 'MCP tools reference' },
  { id: 'tool-ping', label: 'ping' },
  { id: 'tool-config', label: 'config' },
  { id: 'user-interface', label: 'Platform UI' },
  { id: 'configuration', label: 'Configuration' }
]
const validDocIds = new Set(docSections.map((s) => s.id))

// Redirect invalid hash on /docs so URL always has a valid section (avoids null refs and broken state)
watch(
  () => (route.path === '/docs' ? route.hash : ''),
  (hash) => {
    if (route.path !== '/docs') return
    const value = hash ? hash.replace(/^#/, '').trim() : ''
    if (value && !validDocIds.has(value)) {
      router.replace({ path: '/docs', hash: '#quick-start' })
    }
  },
  { immediate: true }
)

const docsActiveSectionId = computed(() => {
  if (route.path !== '/docs') return null
  const hash = route.hash ? route.hash.replace(/^#/, '') : ''
  return validDocIds.has(hash) ? hash : (docSections[0]?.id ?? null)
})

function scrollToDocSection(id: string) {
  router.replace({ path: '/docs', hash: `#${id}` })
  nextTick(() => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// Background spotlight that follows cursor (--mouse-x, --mouse-y from mouse-tracking plugin).
// Purple only (#8B5CF6 = 139,92,246) – no cyan, no green, no blue.
const backgroundLightStyle = {
  background: 'radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 60%)'
}
</script>

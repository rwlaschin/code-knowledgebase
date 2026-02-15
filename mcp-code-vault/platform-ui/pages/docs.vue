<template>
  <div class="flex flex-col min-h-full w-full max-w-none">
    <header
      class="sticky top-0 z-10 shrink-0 px-6 py-4 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#100B1A]"
    >
      <h1 class="text-2xl md:text-3xl font-bold text-white">Docs</h1>
      <div class="flex items-center gap-3 flex-1 sm:flex-initial sm:max-w-md">
        <input
          type="text"
          placeholder="Search..."
          class="flex-1 min-w-0 rounded-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent/50"
          style="background-color: rgba(26, 23, 38, 0.8);"
        />
        <button
          type="button"
          class="shrink-0 rounded-card px-4 py-2.5 text-sm font-medium text-white transition-colors"
          style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);"
        >
          Find
        </button>
      </div>
    </header>
    <article class="text-gray-300 space-y-10 p-6 md:p-8 pt-8">
      <!-- Section: Quick start (only MCP setup lives here) -->
      <section id="quick-start" class="scroll-mt-28">
        <h2 class="text-xl font-semibold text-white mt-0 mb-4 border-b border-white/10 pb-2">Quick start</h2>

        <section id="setting-up-mcp-cursor" class="scroll-mt-28 docs-subsection">
          <h3 class="docs-subsection-title">Setting up MCP with Cursor</h3>
          <ol class="list-decimal list-inside space-y-3 ml-1">
            <li>
              In Cursor, open <strong>Settings → MCP → Add server</strong> (or edit your MCP config file).
            </li>
            <li>
              Add this server. You can paste the block below — we’ve filled in the project path and port when we could:
              <div class="relative mt-2">
                <pre class="p-3 pr-12 rounded-lg bg-black/30 text-gray-200 text-xs overflow-x-auto"><code>{{ mcpSnippet }}</code></pre>
                <button
                  type="button"
                  class="absolute top-2 right-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  @click="copySnippet"
                >
                  {{ copyLabel }}
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-400">
                Please replace the values for <code class="px-1 rounded bg-white/10">cwd</code> and <code class="px-1 rounded bg-white/10">port</code> with your project root directory and the port your MCP server listens on (e.g. 3000). Run <code class="px-1 rounded bg-white/10">npm run build</code> in that directory first so <code class="px-1 rounded bg-white/10">dist/index.js</code> exists.
              </p>
            </li>
            <li>Restart Cursor (or reload MCP) so it picks up the new server.</li>
            <li>In any Cursor chat, ask to use the <strong>ping</strong> tool from the mcp-code-vault MCP. You should get <strong>pong</strong> back — then you know the MCP is running.</li>
          </ol>
        </section>
      </section>

      <!-- Section: User Interface (dashboard / running the app) -->
      <section id="user-interface" class="scroll-mt-28">
        <h2 class="text-xl font-semibold text-white mt-0 mb-4 border-b border-white/10 pb-2">User interface</h2>
        <p class="mb-4 text-gray-400">
          The platform UI gives you a Stats view, Config, and these docs. Here’s how to run it.
        </p>
        <ol class="list-decimal list-inside space-y-3 ml-1">
          <li>From the <strong>repo root</strong>, start the backend: <code class="px-1 rounded bg-white/10">PORT={{ docsContext?.port ?? '3000' }} npm run dev</code> (or set <code class="px-1 rounded bg-white/10">PORT</code> in <code class="px-1 rounded bg-white/10">.env</code>).</li>
          <li>In another terminal, start the UI: <code class="px-1 rounded bg-white/10">npm run dev:ui</code> or <code class="px-1 rounded bg-white/10">cd platform-ui && npm run dev</code>.</li>
          <li>Open <NuxtLink to="/" class="text-accent hover:underline">Stats</NuxtLink>. When the backend is running, you’ll see <strong>Connected</strong> on the Live stream card and the stream event log can show heartbeat events.</li>
        </ol>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const sectionIds = ['quick-start', 'setting-up-mcp-cursor', 'user-interface']

const copyLabel = ref('Copy')

const { data: docsContext } = await useAsyncData(
  'docs-context',
  () => $fetch<{ cwd: string; port: string }>('/api/docs-context'),
  { default: () => ({ cwd: '', port: '3000' }) }
)

onMounted(() => {
  const main = document.querySelector('main')
  if (!main) return

  const updateHashFromScroll = () => {
    const sections = sectionIds
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((s): s is { id: string; el: HTMLElement } => s.el != null)
    if (sections.length === 0) return
    const mainRect = main.getBoundingClientRect()
    const top = mainRect.top + 120
    let current: string = sections[0].id
    for (const { id, el } of sections) {
      const rect = el.getBoundingClientRect()
      if (rect.top <= top) current = id
    }
    const hash = route.hash ? route.hash.replace(/^#/, '') : ''
    if (hash !== current) {
      router.replace({ path: '/docs', hash: `#${current}` })
    }
  }

  updateHashFromScroll()
  main.addEventListener('scroll', updateHashFromScroll, { passive: true })
  onUnmounted(() => main.removeEventListener('scroll', updateHashFromScroll))
})

const mcpSnippet = computed(() => {
  const ctx = docsContext.value
  const rawCwd = ctx?.cwd || '/path/to/mcp-code-vault'
  const cwd = rawCwd.replace(/\\/g, '\\\\') // escape for JSON on Windows
  const port = ctx?.port || '3000'
  return `{
  "mcpServers": {
    "mcp-code-vault": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${cwd}",
      "env": { "PORT": "${port}" }
    }
  }
}`
})

async function copySnippet() {
  try {
    await navigator.clipboard.writeText(mcpSnippet.value)
    copyLabel.value = 'Copied!'
    setTimeout(() => { copyLabel.value = 'Copy' }, 2000)
  } catch {
    copyLabel.value = 'Copy failed'
    setTimeout(() => { copyLabel.value = 'Copy' }, 2000)
  }
}
</script>

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
      <!-- Quick start: MCP setup in Cursor -->
      <section id="quick-start" class="scroll-mt-28">
        <h2 class="text-xl font-semibold text-white mt-0 mb-4 border-b border-white/10 pb-2">Quick start</h2>

        <section id="setting-up-mcp-cursor" class="scroll-mt-28 docs-subsection">
          <h3 class="docs-subsection-title">Setting up the MCP server in Cursor</h3>
          <ol class="list-decimal list-inside space-y-3 ml-1 text-gray-400">
            <li>
              Open <strong>Settings → MCP → Add server</strong> in Cursor (or edit your MCP config file directly).
            </li>
            <li>
              Paste the configuration block below. Replace placeholders as follows:
              <ul class="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li><code class="px-1 rounded bg-white/10">cwd</code> — absolute path to the project root (where <code class="px-1 rounded bg-white/10">dist/index.js</code> will run).</li>
                <li><code class="px-1 rounded bg-white/10">port</code> — port the MCP/stats server listens on (default <code class="px-1 rounded bg-white/10">3000</code>).</li>
                <li><code class="px-1 rounded bg-white/10">MCP_PROJECT_NAME</code> — unique identifier for this project in the database.</li>
              </ul>
              <div class="relative mt-3">
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
                Run <code class="px-1 rounded bg-white/10">npm run build</code> in the project directory before starting the server so <code class="px-1 rounded bg-white/10">dist/index.js</code> exists.
              </p>
            </li>
            <li>Restart Cursor or reload the MCP configuration.</li>
            <li>Verify the connection by calling the <a href="#tool-ping" class="text-accent hover:underline"><code class="px-1 rounded bg-white/10">ping</code> tool</a> from a Cursor chat.</li>
          </ol>
          <div class="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
            <p class="text-sm text-amber-200/90 font-medium mb-1">Troubleshooting</p>
            <p class="text-sm text-amber-100/80">
              If the client reports <code class="px-1 rounded bg-white/10">Cannot find module '…/src/index.ts'</code>, the process was started with the wrong working directory. Use the wrapper entrypoint: set <code class="px-1 rounded bg-white/10">"command": "node"</code> and <code class="px-1 rounded bg-white/10">"args": ["/absolute/path/to/mcp-code-vault/run-mcp.js"]</code> (see <strong>Wrapper script</strong> below).
            </p>
          </div>

          <h4 class="text-sm font-semibold text-white mt-6 mb-2">Directory concepts</h4>
          <p class="text-gray-400 text-sm mb-2">
            <strong>Spawn cwd</strong> — When Cursor starts the MCP server (e.g. <code class="px-1 rounded bg-white/10">npx tsx src/index.ts</code>), the process has a current working directory. If that directory is wrong, relative paths fail (ERR_MODULE_NOT_FOUND) and <code class="px-1 rounded bg-white/10">process.cwd()</code> is wrong. <strong>Project root</strong> — The server’s idea of “project root” (codebase to index) comes from MCP config or <code class="px-1 rounded bg-white/10">process.cwd()</code> at startup; both depend on the spawn cwd being correct.
          </p>

          <h4 class="text-sm font-semibold text-white mt-6 mb-2">Wrapper script (reliable setup)</h4>
          <p class="text-gray-400 text-sm mb-2">
            Use a single entry point with an absolute path so Cursor’s spawn cwd doesn’t matter: <code class="px-1 rounded bg-white/10">"command": "node"</code>, <code class="px-1 rounded bg-white/10">"args": ["/full/path/to/mcp-code-vault/run-mcp.js"]</code>. The wrapper runs from the repo (correct <code class="px-1 rounded bg-white/10">cwd</code> and module resolution). Put this in Cursor → Settings → MCP (or <code class="px-1 rounded bg-white/10">~/.cursor/mcp.json</code>). Restart Cursor or reload MCP.
          </p>

          <h4 class="text-sm font-semibold text-white mt-6 mb-2">Using <code class="text-accent font-mono font-normal">cwd</code> in MCP config</h4>
          <p class="text-gray-400 text-sm">
            Some clients support <code class="px-1 rounded bg-white/10">cwd</code> as the spawn working directory. You can try <code class="px-1 rounded bg-white/10">"cwd": "/full/path/to/mcp-code-vault"</code> with <code class="px-1 rounded bg-white/10">npx</code> / <code class="px-1 rounded bg-white/10">tsx</code>. If it doesn’t work, use the wrapper script above.
          </p>
        </section>
      </section>

      <!-- MCP tools reference -->
      <section id="using-the-mcp" class="scroll-mt-28">
        <h2 class="text-xl font-semibold text-white mt-0 mb-4 border-b border-white/10 pb-2">MCP tools reference</h2>
        <p class="mb-6 text-gray-400">
          The mcp-code-vault server exposes the following tools. Invoke them from a Cursor chat by asking the AI to call the tool by name.
        </p>

        <section id="tool-ping" class="scroll-mt-28 docs-subsection">
          <h3 class="docs-subsection-title"><code class="text-accent font-mono font-normal">ping</code></h3>
          <dl class="space-y-3 text-gray-400">
            <div>
              <dt class="font-medium text-gray-300 mb-1">Description</dt>
              <dd>Verifies that the MCP server is connected and responding. Use after setup or to confirm the connection is still active.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Parameters</dt>
              <dd>None.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Returns</dt>
              <dd>Plain text: <code class="px-1 rounded bg-white/10">pong</code>.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Example (Cursor chat)</dt>
              <dd>
                <blockquote class="pl-4 border-l-2 border-white/20 text-gray-300 not-italic mt-1">
                  Call the ping tool from mcp-code-vault.
                </blockquote>
                <p class="mt-1 text-sm">Response: <code class="px-1 rounded bg-white/10">pong</code>.</p>
              </dd>
            </div>
          </dl>
        </section>

        <section id="tool-settings" class="scroll-mt-28 docs-subsection">
          <h3 class="docs-subsection-title"><code class="text-accent font-mono font-normal">settings</code></h3>
          <dl class="space-y-3 text-gray-400">
            <div>
              <dt class="font-medium text-gray-300 mb-1">Description</dt>
              <dd>Returns the current server settings and the MCP snippet for Cursor — the same content as the Config page in the Platform UI. Read-only.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Parameters</dt>
              <dd>None.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Returns</dt>
              <dd>Plain text: <strong>Code-vault config</strong> (cwd, port), then <strong>MCP snippet (for Cursor)</strong> — a ready-to-paste JSON block for Cursor MCP config.</dd>
            </div>
          </dl>
        </section>

        <section id="tool-config" class="scroll-mt-28 docs-subsection">
          <h3 class="docs-subsection-title"><code class="text-accent font-mono font-normal">config</code></h3>
          <dl class="space-y-3 text-gray-400">
            <div>
              <dt class="font-medium text-gray-300 mb-1">Description</dt>
              <dd>Sets server settings. Pass <code class="px-1 rounded bg-white/10">cwd</code> and/or <code class="px-1 rounded bg-white/10">port</code> to update the working directory or stats port the server reports and uses. Use when you need to correct cwd or port at runtime.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Parameters</dt>
              <dd>Optional: <code class="px-1 rounded bg-white/10">cwd</code> (string), <code class="px-1 rounded bg-white/10">port</code> (string). Pass only the keys you want to update.</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-300 mb-1">Returns</dt>
              <dd>Plain text confirming what was set (e.g. <code class="px-1 rounded bg-white/10">Set: cwd=/path, port=3000</code>) or a message if no settings were provided.</dd>
            </div>
          </dl>
        </section>
      </section>

      <!-- Platform UI -->
      <section id="user-interface" class="scroll-mt-28">
        <h2 class="text-xl font-semibold text-white mt-0 mb-4 border-b border-white/10 pb-2">Platform UI</h2>
        <p class="mb-4 text-gray-400">
          The platform UI provides the Stats dashboard, Config view, and this documentation. To run it:
        </p>
        <ol class="list-decimal list-inside space-y-3 ml-1 text-gray-400">
          <li>From the project root, start the backend: <code class="px-1 rounded bg-white/10">PORT={{ docsContext?.port ?? '3000' }} npm run dev</code> (or set <code class="px-1 rounded bg-white/10">PORT</code> in <code class="px-1 rounded bg-white/10">.env</code>).</li>
          <li>In a separate terminal, start the UI: <code class="px-1 rounded bg-white/10">npm run dev:ui</code> or <code class="px-1 rounded bg-white/10">cd platform-ui && npm run dev</code>. The UI runs on port <code class="px-1 rounded bg-white/10">2999</code> by default.</li>
          <li>Open <NuxtLink to="/" class="text-accent hover:underline">Stats</NuxtLink>. When the backend is running, the Live stream card shows <strong>Connected</strong> and the stream event log displays heartbeat and metric events.</li>
        </ol>
        <h4 class="text-sm font-semibold text-white mt-6 mb-2">Why the backend is required</h4>
        <p class="text-gray-400 text-sm mb-2">
          The same process provides both the MCP (for Cursor) and the HTTP backend (metrics, Socket.IO, discovery). The UI only sees data when that HTTP backend is running. When Cursor starts the MCP server, the process always tries to start the backend too. If that fails (port in use, MongoDB not reachable), the process runs in <strong>MCP-only</strong> mode: Cursor tools work, but there is no HTTP server and no discovery, so the UI shows nothing. Common causes: <code class="px-1 rounded bg-white/10">env</code> not set in Cursor’s MCP config (set <code class="px-1 rounded bg-white/10">PORT</code> and <code class="px-1 rounded bg-white/10">MCP_PROJECT_NAME</code>); port 3000 in use; MongoDB not available when Cursor spawns the process.
        </p>
        <h4 class="text-sm font-semibold text-white mt-4 mb-2">Using the Cursor-started process as the backend</h4>
        <p class="text-gray-400 text-sm mb-2">
          Set <code class="px-1 rounded bg-white/10">env</code> in Cursor’s MCP config (<code class="px-1 rounded bg-white/10">PORT</code>, e.g. 3000 or 3100; <code class="px-1 rounded bg-white/10">MCP_PROJECT_NAME</code>). Ensure MongoDB is reachable (same <code class="px-1 rounded bg-white/10">MONGO_URL</code> / <code class="px-1 rounded bg-white/10">.env</code>). Start the UI: if backend is on 3000, run <code class="px-1 rounded bg-white/10">npm run dev:ui</code>; if on 3100, run <code class="px-1 rounded bg-white/10">NUXT_PUBLIC_UI_PORT=3100 STATS_PORT=3100 npm run dev</code> in platform-ui. After reloading MCP, the Cursor-started process should register with the UI on UDP 9255.
        </p>
        <h4 class="text-sm font-semibold text-white mt-4 mb-2">Running the backend separately</h4>
        <p class="text-gray-400 text-sm">
          If the Cursor-started process never gets a working backend, run it yourself: in mcp-code-vault run <code class="px-1 rounded bg-white/10">PORT=3100 npm run dev</code> (or 3000); in platform-ui run <code class="px-1 rounded bg-white/10">NUXT_PUBLIC_UI_PORT=3100 STATS_PORT=3100 npm run dev</code> so the UI connects to that backend.
        </p>
      </section>

      <!-- Configuration -->
      <section id="configuration" class="scroll-mt-28">
        <h2 class="text-xl font-semibold text-white mt-0 mb-4 border-b border-white/10 pb-2">Configuration</h2>
        <p class="mb-4 text-gray-400">
          Projects, models, personas, and agents are configured in the <strong>database</strong>. Only connection secrets (e.g. <code class="px-1 rounded bg-white/10">MONGO_URL</code>, <code class="px-1 rounded bg-white/10">GEMINI_API_KEY</code>) go in <code class="px-1 rounded bg-white/10">.env</code>.
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-400 text-sm">
          <li><strong>Project identity</strong> — No global “current project”. Each MCP connection is for one project. Project name/key comes from MCP config; the project is created in the DB when first registered (UI or MCP tool).</li>
          <li><strong>Models</strong> — Defined globally; list of allowed models in DB. Per project: one default model. Per agent: assign allowed models (or use project default).</li>
          <li><strong>Personas</strong> — Global; optional per agent. If no personas assigned to an agent, no persona is used.</li>
          <li><strong>Setup flow</strong> — Choose/create project → optionally edit personas (global) → edit agents for the selected project (models, personas, tools) → save. Changes hot-reload from DB without restart.</li>
          <li><strong>Two places to configure</strong> — Via MCP tools or via the platform UI; both read/write the same database.</li>
          <li><strong>Project root / cwd</strong> — Prefer <code class="px-1 rounded bg-white/10">cwd</code> in MCP config; fallback <code class="px-1 rounded bg-white/10">process.cwd()</code> at startup. Moving the project = update MCP config to the new path; project key in DB stays the same.</li>
        </ul>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const sectionIds = ['quick-start', 'setting-up-mcp-cursor', 'using-the-mcp', 'tool-ping', 'tool-settings', 'tool-config', 'user-interface', 'configuration']
const validSectionIds = new Set(sectionIds)

function getHashValue(): string {
  const h = route.hash ?? (typeof window !== 'undefined' ? window.location.hash : '')
  return (h && h.startsWith('#')) ? h.slice(1).trim() : ''
}

function ensureValidHash(): void {
  if (route.path !== '/docs') return
  const hash = getHashValue()
  if (hash && !validSectionIds.has(hash)) {
    router.replace({ path: '/docs', hash: '#quick-start' })
  }
}

// If hash is present but invalid, redirect to /docs#quick-start (run on mount and when route hash changes)
onMounted(ensureValidHash)
watch([() => route.path, () => route.hash], ensureValidHash, { immediate: true })

const copyLabel = ref('Copy')

const { data: docsContext } = await useAsyncData(
  'docs-context',
  () => $fetch<{ cwd: string; port: string }>('/api/docs-context'),
  { default: () => ({ cwd: '', port: '3000' }) }
)

// Scroll-to-hash: update URL hash when user scrolls so it reflects the section in view
onMounted(() => {
  const main = document.querySelector('main')
  if (!main) return

  let mounted = true

  const updateHashFromScroll = () => {
    if (!mounted || !document.body.contains(main)) return
    const sections = sectionIds
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((s): s is { id: string; el: HTMLElement } => s.el != null)
    if (sections.length === 0) return
    const mainRect = main.getBoundingClientRect()
    const top = mainRect.top + 120
    let current: string = sections[0].id
    for (const { id, el } of sections) {
      if (!document.body.contains(el)) return
      const rect = el.getBoundingClientRect()
      if (rect.top <= top) current = id
    }
    const hash = route.hash ? route.hash.replace(/^#/, '') : ''
    if (hash !== current) {
      nextTick(() => {
        if (mounted) router.replace({ path: '/docs', hash: `#${current}` })
      })
    }
  }

  updateHashFromScroll()
  main.addEventListener('scroll', updateHashFromScroll, { passive: true })
  onUnmounted(() => {
    mounted = false
    if (document.body.contains(main)) {
      main.removeEventListener('scroll', updateHashFromScroll)
    }
  })
})

const mcpSnippet = computed(() => {
  const ctx = docsContext.value
  const rawCwd = ctx?.cwd || '/path/to/your-project-root'
  const cwd = rawCwd.replace(/\\/g, '\\\\') // escape for JSON on Windows
  const port = ctx?.port || '3000'
  const projectName = 'my-project' // user should set this to identify this repo in the DB
  return `{
  "mcpServers": {
    "mcp-code-vault": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${cwd}",
      "env": {
        "PORT": "${port}",
        "MCP_PROJECT_NAME": "${projectName}"
      }
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

import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const streamStatus = ref("disconnected");
    const lastStreamEvent = ref("");
    const streamEventTime = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "p-6 md:p-8",
        style: { "background-color": "#100B1A" }
      }, _attrs))}><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"><h1 class="text-2xl md:text-3xl font-bold text-white">Stats</h1><div class="flex items-center gap-3 flex-1 sm:flex-initial sm:max-w-md"><input type="text" placeholder="Search..." class="flex-1 min-w-0 rounded-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" style="${ssrRenderStyle({ "background-color": "rgba(26, 23, 38, 0.8)" })}"><button type="button" class="shrink-0 rounded-card px-4 py-2.5 text-sm font-medium text-white transition-colors" style="${ssrRenderStyle({ "background": "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" })}"> Refresh </button></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"><div class="rounded-card p-6 relative overflow-hidden min-h-[180px] flex flex-col justify-between" style="${ssrRenderStyle({ "background": "linear-gradient(135deg, #1e1b2e 0%, #2d1f3d 40%, #1a1625 100%)", "box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.2)" })}"><div class="relative z-10"><p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">MCP Code Vault</p><h2 class="text-xl font-bold text-white mb-2">Live stream</h2><p class="text-sm text-gray-400">Server-sent events from the stats backend.</p></div><div class="relative z-10 mt-4">`);
      if (unref(streamStatus) === "error") {
        _push(`<div class="rounded-lg p-3 text-sm" style="${ssrRenderStyle({ "background-color": "rgba(0,0,0,0.25)", "border": "1px solid rgba(251, 191, 36, 0.3)", "color": "#FCD34D" })}"><p class="font-medium">Backend not connected</p><p class="text-gray-400 mt-1">Run <code class="px-1 rounded bg-black/20">npm run dev</code> from <code class="px-1 rounded bg-black/20">mcp-code-vault</code> root (port 3000). Set <code class="px-1 rounded bg-black/20">STATS_PORT</code> if different.</p></div>`);
      } else {
        _push(`<div class="flex items-center gap-2"><span class="${ssrRenderClass([unref(streamStatus) === "connected" ? "bg-emerald-500" : "bg-gray-500", "w-2.5 h-2.5 rounded-full shrink-0"])}"></span><span class="text-gray-300 text-sm">${ssrInterpolate(unref(streamStatus) === "connected" ? "Connected" : "Connecting\u2026")}</span></div>`);
      }
      _push(`</div><div class="absolute top-2 right-2 w-16 h-16 rounded-full opacity-30" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" })}"></div><div class="absolute bottom-4 right-8 w-12 h-12 rounded-full opacity-20" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #EC4899 0%, transparent 70%)" })}"></div></div><div class="rounded-card p-6 flex flex-col" style="${ssrRenderStyle({ "background-color": "#1A1726", "box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.2)" })}"><div class="flex items-center justify-between mb-4"><span class="text-sm font-medium text-gray-300">Stream events</span><div class="flex gap-1 rounded-lg p-0.5" style="${ssrRenderStyle({ "background-color": "rgba(255,255,255,0.05)" })}"><button type="button" class="rounded btn px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-white transition-colors">1m</button><button type="button" class="rounded btn px-2.5 py-1 text-xs font-medium text-white" style="${ssrRenderStyle({ "background-color": "#1A1726" })}">Live</button></div></div>`);
      if (unref(lastStreamEvent)) {
        _push(`<pre class="flex-1 text-xs overflow-auto rounded-lg p-3 min-h-[120px] text-gray-300 font-mono" style="${ssrRenderStyle({ "background-color": "rgba(0,0,0,0.2)" })}">${ssrInterpolate(unref(lastStreamEvent))}</pre>`);
      } else {
        _push(`<p class="text-sm text-gray-500 flex-1 flex items-center">Waiting for events\u2026</p>`);
      }
      _push(`</div></div><div><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4"><h2 class="text-lg font-bold text-white">Stream event log</h2><div class="flex gap-1 rounded-lg p-0.5" style="${ssrRenderStyle({ "background-color": "#1A1726" })}"><button type="button" class="rounded btn px-3 py-1.5 text-sm font-medium text-white transition-colors" style="${ssrRenderStyle({ "background": "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" })}">Live</button><button type="button" class="rounded btn px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">History</button></div></div><div class="rounded-card overflow-hidden" style="${ssrRenderStyle({ "background-color": "#1A1726", "box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.2)" })}"><table class="w-full text-left text-sm"><thead><tr class="border-b border-white/5"><th class="px-4 py-3 font-medium text-gray-400">Event</th><th class="px-4 py-3 font-medium text-gray-400">Time</th><th class="px-4 py-3 font-medium text-gray-400">Data</th></tr></thead><tbody class="text-gray-300">`);
      if (!unref(lastStreamEvent)) {
        _push(`<tr class="border-b border-white/5"><td colspan="3" class="px-4 py-6 text-center text-gray-500">No events yet. Connect the backend to see the stream.</td></tr>`);
      } else {
        _push(`<tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td class="px-4 py-3"><span class="rounded-full px-2 py-0.5 text-xs font-medium" style="${ssrRenderStyle({ "background-color": "rgba(139, 92, 246, 0.3)", "color": "#C4B5FD" })}">heartbeat</span></td><td class="px-4 py-3 text-gray-400">${ssrInterpolate(unref(streamEventTime))}</td><td class="px-4 py-3 font-mono text-xs truncate max-w-[200px]">${ssrInterpolate(unref(lastStreamEvent))}</td></tr>`);
      }
      _push(`</tbody></table></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-D2erdgqY.mjs.map

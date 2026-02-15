import { mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';
import 'module';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    class: "p-6 md:p-8",
    style: { "background-color": "#100B1A" }
  }, _attrs))}><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"><h1 class="text-2xl md:text-3xl font-bold text-white">Docs</h1><div class="flex items-center gap-3 flex-1 sm:flex-initial sm:max-w-md"><input type="text" placeholder="Search..." class="flex-1 min-w-0 rounded-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent/50" style="${ssrRenderStyle({ "background-color": "rgba(26, 23, 38, 0.8)" })}"><button type="button" class="shrink-0 rounded-card px-4 py-2.5 text-sm font-medium text-white transition-colors" style="${ssrRenderStyle({ "background": "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" })}"> Open </button></div></div><div class="rounded-card p-6" style="${ssrRenderStyle({ "background-color": "#1A1726", "box-shadow": "0 4px 6px -1px rgb(0 0 0 / 0.2)" })}"><p class="text-gray-400">Empty for now.</p></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/docs.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const docs = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { docs as default };
//# sourceMappingURL=docs-D6MIk2nA.mjs.map

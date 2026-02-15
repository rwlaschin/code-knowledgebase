# Requirements

## Platform UI: Neon-Glass System Style Guide (required)

The **platform-ui** (Nuxt 3 app) MUST follow the **Neon-Glass** dashboard system style guide. See **platform-ui/SYSTEM_STYLE_GUIDE.md** for the definitive visual rules, blending layers, typography, interaction, iconography, and responsive grid.

**Required libraries/frameworks** (must be installed in `platform-ui`):

- **UI Framework:** [Nuxt UI](https://ui.nuxt.com/) — theme: `primary: 'cyan'`, `gray: 'slate'`. *Note: Nuxt UI v4 requires Nuxt 4; add when upgrading. Until then, use the GlassCard + Tailwind utilities from the style guide.*
- **Motion:** [@vueuse/motion](https://motion.vueuse.org/) — spring-based reactive animations. *(Installed.)*
- **Icons:** [@nuxt/icon](https://nuxt.com/modules/icon) or **nuxt-icon** — Lucide (2px stroke, linear, non-filled). *(Currently: nuxt-icon; migrate to @nuxt/icon when on Nuxt 4.)*
- **Charts:** [ApexCharts](https://apexcharts.com/) with **vue3-apexcharts** — data viz with SVG gradients. *(Installed.)*

Implement the master **GlassCard** component and Tailwind extensions (noise, neon shadows) as specified in `platform-ui/SYSTEM_STYLE_GUIDE.md`.

**Motion & page transitions:** Follow the **Motion & Animation** addendum in the style guide (§9): Elastic Precision easing, page transitions (slide-up + fade, 400ms), staggered card entrance (50ms delay), glow pulse for neon elements, and blend interpolation (blur-xl → blur-2xl on hover). Use the mouse-tracking plugin (`--mouse-x`, `--mouse-y`) for glass specular reaction to cursor. Enable `app.pageTransition` in `nuxt.config.ts` and register the VueUse Motion plugin.

---

## ES2022 syntax (required)

Use modern syntax only:

- **`??`** (nullish coalescing) for optional defaults — not `||` for env/defaults.
- **`?.`** (optional chaining) for nullable access.
- **`!`** (non-null assertion) when the type is already narrowed.

No defensive checks for impossible cases.

## Startup: fail-fast

Do **not** provide defaults for values that must be explicit at startup. Missing config must throw immediately.

- **PORT** — required; throw if unset or invalid.
- **MONGO_URL** — required; throw if unset.

Fixed in **config** (user does not set these): see `src/config.ts` (e.g. **DB_NAME** = `mcp_code_vault`).

Optional settings (e.g. LOG_LEVEL) may use `?? 'default'`.

# Neon-Glass System Style Guide

This is the definitive **System Style Guide** for the "Neon-Glass" Dashboard. It codifies the visual rules, blending math, and structural components required to replicate the high-fidelity UI from the reference.

---

## 1. Core Visual Foundations

### A. The Surface "Glass" Stack

The UI is built on a "layered translucency" model. Every card is a composite of four distinct layers to achieve the depth seen in the reference.

| Layer | CSS / Tailwind Class | Blend Mode | Purpose |
| --- | --- | --- | --- |
| **0. Background** | `bg-slate-950` | N/A | Base canvas. |
| **1. Blur** | `backdrop-blur-2xl` | N/A | Diffuses background light. |
| **2. Tint** | `bg-white/[0.03]` | **Normal** | Adds "substance" to the glass. |
| **3. Texture** | `bg-noise` (Custom) | **Soft-Light** | Eliminates digital banding. |
| **4. Specular** | `bg-gradient-to-br from-white/10 to-transparent` | **Overlay** | Simulates top-down light. |

### B. Color Tokens (Tailwind)

* **Primary Background:** `bg-[#020617]` (Slate 950)
* **Card Fill:** `bg-white/5`
* **Border (Inert):** `border-white/10`
* **Border (Illuminated):** `border-white/20`
* **Accent (Cyan):** `text-cyan-400` / `shadow-cyan-500/20`
* **Accent (Emerald):** `text-emerald-400` (Success/Up)
* **Accent (Rose):** `text-rose-500` (Danger/Down)

---

## 2. Typography & Hierarchy

### A. Specs

* **Primary Typeface:** *Inter* or *Geist Sans* (Variable).
* **Numeric Data:** *JetBrains Mono* or *Geist Mono* (for tabular lining).

### B. Hierarchy Table

| Element | Size | Weight | Color | Tracking |
| --- | --- | --- | --- | --- |
| **Hero Balance** | `text-4xl` | `font-bold` | `text-white` | `-tight` |
| **Widget Title** | `text-[10px]` | `font-bold` | `text-slate-500` | `widest` |
| **Body / Labels** | `text-sm` | `font-medium` | `text-slate-400` | `normal` |
| **Trend %** | `text-xs` | `font-bold` | `text-emerald-400` | `normal` |

---

## 3. Interaction & Micro-interacts

### A. Hover Logic (The "Focus" State)

When a user hovers over a glass pane (GlassCard):

1. **Border Brightness:** `border-white/10` → `border-white/20`
2. **Blur:** `backdrop-blur-xl` → `backdrop-blur-2xl` so the glass feels thicker as you "touch" it.
3. **Gentle Scale:** `scale(1.005)` — very subtle so the panel feels responsive without popping.
4. **Tint:** Inner overlay `bg-white/[0.02]` → `bg-white/[0.04]`.
5. **Transition:** Tailwind only — `transition-[border-color,backdrop-filter,transform] duration-300` (no custom CSS).

### B. Active/Click Logic

* **Buttons:** **active** `scale(0.99)` (see Button Micro-interactions below).
* **Glow:** Brief expansion of accent glow where applicable.

### B2. Button Micro-interactions (global, Tailwind-only)

All `button` elements get transitions via **Tailwind only** in `app.css` (`@layer components`):

* **Hover:** `scale(1.02)` — **Active:** `scale(0.99)`
* **Duration:** `300ms` — **Easing:** `ease-in-out` (smooth, no bounce).

Use `duration-300 ease-in-out`; do not add custom transition CSS for buttons.

### C. Transitions

* **Standard UI (panels, buttons):** `duration-300 ease-in-out` — use Tailwind classes only.
* **Layout Changes:** `duration-500` with `out-expo` or `ease-out`.
* **No mixing:** Avoid inline `style` or custom `transition-*` CSS; use Tailwind utilities so behavior stays consistent.

### D. Staggered Entrance

When a dashboard view loads, cards must not appear at once. Apply a **50ms delay increment** per card (e.g. card 0: 0ms, card 1: 50ms, card 2: 100ms). Use VueUse Motion or data attributes for delay.

### E. The "Glow Pulse"

Active neon elements (e.g. "Live" indicator, primary buttons) use an infinite breathing animation on `box-shadow` with **accent purple**:

* From: `0 0 10px rgba(139, 92, 246, 0.25)`
* To: `0 0 20px rgba(139, 92, 246, 0.5)`

Use CSS `@keyframes` (e.g. `glow-pulse` in `app.css`) or Tailwind `animate-glow-pulse`. Duration ~2s, ease-in-out, infinite alternate.

---

## 4. Iconography Standards

* **Style:** 2px stroke, linear, non-filled icons (Lucide or Heroicons).
* **Coloration:** Icons should inherit `text-slate-400` by default.
* **Interactive Icons:** When active, icons receive a `filter: drop-shadow(0 0 5px currentColor)`.

---

## 5. Reactive Responsive Grid

A 12-column grid that shifts density based on viewport.

* **Desktop (XL):** 12 Cols. Sidebar: 250px. Gutters: 24px.
* **Tablet (MD):** 6 Cols. Sidebar: 80px (Icons only). Gutters: 16px.
* **Mobile (SM):** 1 Col. Sidebar: Bottom Navigation Bar. Gutters: 12px.

---

## 6. Nuxt 3 Implementation Stack

Recommended libraries that natively support these styles without manual CSS:

* **UI Framework:** [Nuxt UI](https://ui.nuxt.com/) — Set `primary: 'cyan'`, `gray: 'slate'` in `app.config.ts`. *Nuxt UI v4 requires Nuxt 4; add when upgrading.*
* **Motion:** [@vueuse/motion](https://motion.vueuse.org/) — Spring-based reactive animations. *(Installed.)*
* **Icons:** [@nuxt/icon](https://nuxt.com/modules/icon) or **nuxt-icon** — Lucide set (2px stroke, linear). *(Currently: nuxt-icon; use @nuxt/icon on Nuxt 4.)*
* **Charts:** [ApexCharts](https://apexcharts.com/) + **vue3-apexcharts** — Data viz with SVG gradients. *(Installed.)*

---

## 7. Master GlassCard Component

Use the shared **GlassCard** component (`components/GlassCard.vue`) for all glass panes. It implements:

* **Layers:** Blur, light tint, noise texture, and hard border shine (`.glass-panel-shine`). Layout specular is on the layout background only, not on the card.
* **Hover/transition (Tailwind only):** `transition-[border-color,backdrop-filter,transform] duration-300`, with `hover:border-white/20`, `hover:backdrop-blur-2xl`, `hover:scale-[1.005]`. Inner overlay uses `transition-colors duration-300 ease-out`. No inline styles or custom CSS for transitions.

---

## 8. Tailwind Config Extensions

The project `tailwind.config.ts` extends the theme with:

* **Noise texture:** `backgroundImage` / utility for `bg-noise` (e.g. external noise SVG or data URI).
* **Neon shadows:** `boxShadow` entries for `shadow-neon-cyan`, `shadow-neon-cyan/20`, etc., for glow effects.

See `tailwind.config.ts` and `components/GlassCard.vue` for the concrete implementation.

---

## 9. Motion & Animation Style Guide

### 9.1 Animation Philosophy

Use **ease-in-out** for standard UI (buttons, panels): smooth, no bounce. Avoid back-out / spring curves for everyday interactions.

* **Standard UI timing:** **300ms** with **ease-in-out** (buttons, card hover).
* **Page transitions:** 400ms with **ease-out**.

### 9.2 Page Transitions (Nuxt)

Pages use a shared-element feel: new content slides **up** (e.g. 20px) and fades in; subtle scale from `0.98` to `1` ("opening a window"). Leave: slide up slightly and fade out.

* **Name:** `page`, **mode:** `out-in`.
* **Duration:** 400ms with **ease-out** (no back-out).

See global CSS (e.g. `app.css`) for `.page-enter-active`, `.page-leave-active`, `.page-enter-from`, `.page-leave-to`.

### 9.3 Global Motion Config (Reference Table)

| Interaction      | Trigger       | Animation Type     | Timing   |
|------------------|---------------|--------------------|----------|
| **Page Change**   | Route change  | Slide-Up + Fade    | 400ms ease-out |
| **Widget Load**  | Mount         | Staggered Fade-In  | 50ms delay per card |
| **Button**       | hover/active  | Scale 1.02 / 0.99  | 300ms ease-in-out |
| **Card Hover**   | mouseenter    | Border + blur + scale(1.005) | 300ms |

### 9.4 Motion Frameworks for Nuxt

* **[VueUse / Motion](https://motion.vueuse.org/)** — Spring physics; use for cards "popping" into view (e.g. `v-motion-roll-visible-bottom`). *Installed; register via plugin.*
* **[AutoAnimate](https://auto-animate.formkit.com/)** — Zero-config list transitions; add to parent container so reordering/filtering of glass cards animates automatically.
* **[GSAP (GreenSock)](https://gsap.com/)** — High-end chart line "draw-in" and complex SVG animation when the page loads.

### 9.5 Nuxt Setup (Motion)

1. **Page transitions:** In `nuxt.config.ts`, set `app: { pageTransition: { name: 'page', mode: 'out-in' } }`.
2. **Motion plugin:** Register `@vueuse/motion` in a Nuxt plugin (e.g. `plugins/motion.client.ts`).
3. **Mouse-tracking plugin:** A client-only plugin updates CSS variables `--mouse-x` and `--mouse-y` on the root so glass specular layers can react to the cursor across components.

<template>
  <div class="p-6 md:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Config</h1>
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
          Save
        </button>
      </div>
    </div>
    <GlassCard>
      <p class="text-gray-400">Empty for now.</p>
    </GlassCard>
  </div>
</template>

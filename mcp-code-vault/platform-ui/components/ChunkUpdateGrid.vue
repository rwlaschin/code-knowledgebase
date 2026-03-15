<template>
  <div class="chunk-update-grid">
    <p v-if="summaryLine" class="text-sm text-gray-400 mb-3">
      {{ summaryLine }}
    </p>
    <div
      class="flex flex-wrap gap-0.5 overflow-auto max-h-[320px] rounded-xl border border-white/10 p-2 bg-white/[0.02]"
    >
      <div
        v-for="(file, i) in files"
        :key="file.relativePath + String(i)"
        class="rounded-sm transition-colors duration-200"
        :class="blockClass(file.state)"
        :style="blockStyle"
        :title="file.relativePath"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ScanFileEntry {
  relativePath: string
  state: 'new' | 'stale' | 'fresh'
}

const props = withDefaults(
  defineProps<{
    files: ScanFileEntry[]
    filesProcessed?: number
    filesUpdated?: number
  }>(),
  { filesProcessed: 0, filesUpdated: 0 }
)

const blockStyle = { width: '10px', height: '5px', minWidth: '10px', minHeight: '5px' }

function blockClass(state: 'new' | 'stale' | 'fresh'): string {
  if (state === 'new') return 'bg-transparent'
  if (state === 'stale') return 'bg-amber-400/70'
  return 'bg-emerald-500/70'
}

const summaryLine = computed(() => {
  const p = props.filesProcessed
  const u = props.filesUpdated
  if (p === 0 && u === 0 && props.files.length === 0) return null
  return `${p} files processed, ${u} updated.`
})
</script>

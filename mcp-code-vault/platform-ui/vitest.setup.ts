import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue';

// Assign once per process (setupFiles runs before each file; guard avoids repeated work).
if (!(globalThis as any).__vitestVueSetup) {
  (globalThis as any).ref = ref;
  (globalThis as any).onMounted = onMounted;
  (globalThis as any).onUnmounted = onUnmounted;
  (globalThis as any).computed = computed;
  (globalThis as any).watch = watch;
  (globalThis as any).reactive = reactive;
  (globalThis as any).__vitestVueSetup = true;
}

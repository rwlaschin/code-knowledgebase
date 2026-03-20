import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue';

// Assign once per process (setupFiles runs before each file; guard avoids repeated work).
if (!(globalThis as any).__vitestVueSetup) {
  (globalThis as any).ref = ref;
  (globalThis as any).onMounted = onMounted;
  (globalThis as any).onUnmounted = onUnmounted;
  (globalThis as any).computed = computed;
  (globalThis as any).watch = watch;
  (globalThis as any).reactive = reactive;
  // Nuxt `useState()` shim for unit tests.
  // Provides a shared ref per key across pages/components within the test environment.
  const stateMap = new Map<string, ReturnType<typeof ref>>();
  (globalThis as any).useState = (key: string, init: () => unknown) => {
    if (!stateMap.has(key)) stateMap.set(key, ref(init()));
    return stateMap.get(key)!;
  };
  (globalThis as any).__vitestVueSetup = true;
}

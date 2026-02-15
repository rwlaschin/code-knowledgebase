import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue';

(globalThis as any).ref = ref;
(globalThis as any).onMounted = onMounted;
(globalThis as any).onUnmounted = onUnmounted;
(globalThis as any).computed = computed;
(globalThis as any).watch = watch;
(globalThis as any).reactive = reactive;

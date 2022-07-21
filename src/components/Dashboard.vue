<template>
  <div :id="id" :ref="id" v-if="d">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, provide } from 'vue';

import { Dashboard } from '../models/Dashboard';
import { throttle } from '@/helpers';

const RESIZE_THROTTLE_MS: number = 1000 / 30; // 30 fps

export default defineComponent({
  name: 'Dashboard',
  inheritAttrs: false,
  props: {
    id: { type: String, required: true },
    autoHeight: { type: Boolean, default: Dashboard.defaults.autoHeight },
  },
  data() {
    return {
      d: null as unknown as Dashboard,
      element: null as unknown as Element,
      resizeCallback: throttle(this.resizeCallbackThrottled, RESIZE_THROTTLE_MS),
      resizeObserver: null as unknown as ResizeObserver,
    };
  },
  computed: {
    currentBreakpoint() {
      if (this.d) {
        return this.d.currentBreakpoint;
      }
      return null;
    },
  },
  watch: {
    currentBreakpoint(newValue) {
      if (newValue) {
        this.$emit('currentBreakpointUpdated', newValue);
      }
    },
  },
  methods: {
    onResize() {
      if (this.d) {
        this.d.width = this.element.clientWidth;
      }
    },
    createPropWatchers() {
      Object.keys(this.$props).forEach((key) => {
        this.$watch(
          key,
          (newValue: any) => {
            const field = key as keyof Dashboard;
            //If the prop did not cause the update there is no updating
            if (this.d[field] === newValue) {
              return;
            }
            this.d.setValueToField(field, newValue);
          },
          { deep: true }
        );
      });
    },
  },
  created() {
    // Используем Resize Observer API
    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.d = new Dashboard(this.$props);
    this.createPropWatchers();
    provide('$dashboard', this.d);
  },
  mounted() {
    this.element = (this.$refs[this.id] as Element) ?? null;
    if (this.element) {
      this.resizeObserver.observe(this.element);
    }
  },
  beforeUnmount() {
    if (this.element) {
      this.resizeObserver.unobserve(this.element);
      this.resizeObserver.disconnect();
    }
  },
});
</script>

<style></style>

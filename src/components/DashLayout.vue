<template>
  <div v-if="currentBreakpoint === breakpoint">
    <div v-if="l" :style="{ position: 'relative', height: height, width: width }">
      <slot></slot>
      <DashItem
        :id="placeholderId"
        :draggable="false"
        :resizable="false"
        v-show="dragging || resizing"
        v-model:y="placeholderY"
        v-model:height="placeholderHeight"
        v-model:maxWidth="placeholderMaxWidth"
      >
        <slot name="placeholder">
          <div class="placeholder"></div>
        </slot>
      </DashItem>
    </div>
    <div v-if="debug">
      Layout Breakpoint: {{ breakpoint }} <br />
      Layout Number of Cols: {{ numberOfCols }} <br />
      placeholder: {{ JSON.stringify(placeholder) }} <br />
      Items: {{ JSON.stringify(itemsFromLayout) }} <br />
      Height: {{ height }} <br />
      Attrs: {{ $attrs }}
    </div>
  </div>
</template>

<script lang="ts">
import DashItem from './DashItem.vue';
import { Dashboard, Item, Layout } from '@/models';

import { defineComponent } from 'vue';
import { provide, inject } from 'vue';

export default defineComponent({
  name: 'DashLayout',
  inheritAttrs: false,
  props: {
    breakpoint: { type: String, required: true },
    breakpointWidth: { type: Number, default: Layout.defaults.breakpointWidth },
    numberOfCols: { type: Number, default: Layout.defaults.numberOfCols },
    useCssTransforms: {
      type: Boolean,
      default: Layout.defaults.useCssTransforms,
    },
    compact: { type: Boolean, default: Layout.defaults.compact },
    debug: { type: Boolean, default: false },
    margin: { type: Object, default: Layout.defaults.margin },
    rowHeight: {
      type: [Boolean, Number],
      default: Layout.defaults.rowHeight,
    },
    maxRowHeight: {
      type: [Boolean, Number],
      default: Layout.defaults.maxRowHeight,
    },
    minRowHeight: {
      type: [Boolean, Number],
      default: Layout.defaults.minRowHeight,
    },
    colWidth: {
      type: [Boolean, Number],
      default: Layout.defaults.colWidth,
    },
    maxColWidth: {
      type: [Boolean, Number],
      default: Layout.defaults.maxColWidth,
    },
    minColWidth: {
      type: [Boolean, Number],
      default: Layout.defaults.minColWidth,
    },
  },
  components: {
    DashItem,
  },
  data() {
    return {
      l: null as unknown as Layout,
      dashboard: null as unknown as Dashboard,
      placeholderId: '-1Placeholder',
      placeholderY: 0,
      placeholderHeight: 0,
      placeholderMaxWidth: false,
      // eslint-disable-next-line @typescript-eslint/ban-types
      unWatch: null as unknown as Function,
    };
  },
  // inject: { $dashboard: { default: null } },
  computed: {
    currentBreakpoint() {
      if (this.dashboard) {
        return this.dashboard.currentBreakpoint;
      }
      return '';
    },
    dragging() {
      return this.l.itemBeingDragged;
    },
    resizing() {
      return this.l.itemBeingResized;
    },
    placeholder() {
      if (this.l?.placeholder) {
        return this.l.placeholder.toItem();
      }
      return '';
    },
    itemsFromLayout() {
      if (this.l) {
        return this.l.items;
      }
      return [];
    },
    height() {
      if (this.l) {
        return this.l.height + 'px';
      }
      return '0px';
    },
    width() {
      if (this.l) {
        return this.l.width + 'px';
      }
      return '0px';
    },
  },
  methods: {
    createPropWatchers() {
      //Setup prop watches to sync with the Dash Item
      Object.keys(this.$props).forEach((key) => {
        this.$watch(
          key,
          (newValue: any) => {
            const field = key as keyof Layout;

            //If the prop did not cause the update there is no updating
            if (this.l[field] === newValue) {
              return;
            }

            this.l.setValueToField(field, newValue);
          },
          { deep: true }
        );
      });
    },
  },
  created() {
    this.dashboard = inject('$dashboard') as Dashboard;
  },
  mounted() {
    let initialItems: Item[] = [];
    if (this.$attrs?.items as Item[]) {
      initialItems = this.$attrs.items as Item[];
    }
    this.l = new Layout({ ...this.$props, margin: { x: this.margin['x'], y: this.margin['y'] }, initialItems });
    provide('$layout', this.l);
    //Check if dashboard exists and if not then start a watcher
    if (this.dashboard) {
      this.dashboard.addLayoutInstance(this.l as Layout);
      this.createPropWatchers();
    } else {
      this.unWatch = this.$watch(
        'dashboard',
        (newValue: any) => {
          if (newValue) {
            this.dashboard!.addLayoutInstance(this.l as Layout);
            this.createPropWatchers();
            this.unWatch();
          }
        },
        { immediate: true }
      );
    }
  },
  beforeUnmount() {
    if (this.dashboard) {
      this.dashboard.removeLayoutInstance(this.l as Layout);
    }
  },
});
</script>

<style scoped>
.placeholder {
  height: 100%;
  width: 100%;
  background-color: red;
  opacity: 0.2;
}
</style>

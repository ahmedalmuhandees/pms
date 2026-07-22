<script setup lang="ts">
import { computed } from 'vue'
import Skeleton from 'primevue/skeleton'

const props = withDefaults(
  defineProps<{
    rows?: number
    columns?: number
  }>(),
  {
    rows: 8,
    columns: 5,
  },
)

const gridStyle = computed(() => {
  const mid = Math.max(props.columns - 2, 1)
  return {
    gridTemplateColumns: `1.4fr repeat(${mid}, 1fr) 0.7fr`,
  }
})
</script>

<template>
  <div class="table-skeleton" aria-busy="true" aria-label="جاري التحميل">
    <div class="table-skeleton__head" :style="gridStyle">
      <Skeleton
        v-for="col in columns"
        :key="`h-${col}`"
        height="0.85rem"
        :width="col === columns ? '4.5rem' : undefined"
        border-radius="8px"
      />
    </div>
    <div
      v-for="row in rows"
      :key="row"
      class="table-skeleton__row"
      :style="gridStyle"
    >
      <Skeleton
        v-for="col in columns"
        :key="`${row}-${col}`"
        height="1rem"
        :width="col === 1 ? '70%' : col === columns ? '3.5rem' : undefined"
        border-radius="8px"
      />
    </div>
  </div>
</template>

<style scoped>
.table-skeleton {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.table-skeleton__head,
.table-skeleton__row {
  display: grid;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
}

.table-skeleton__head {
  background: linear-gradient(180deg, #f7fafb, #f2f6f8);
  border-bottom: 1px solid var(--border);
}

.table-skeleton__row + .table-skeleton__row {
  border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
}

.table-skeleton__row:nth-child(even) {
  background: #fafcfd;
}
</style>

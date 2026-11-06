<script setup lang="ts">
import { tableSortModeLabel, type TableSortMode } from '@/utils/tableSort'

defineProps<{
  sortMode: TableSortMode
}>()
</script>

<template>
  <div class="table-sort-caption">
    <i class="pi pi-sort-alt" />
    <span>
      الترتيب الحالي:
      <strong>{{ tableSortModeLabel(sortMode) }}</strong>
      — انقر اسم أي عمود للتبديل (آخر إضافة ← تسلسلي ← عكسي)
    </span>
  </div>
</template>

<style scoped>
.table-sort-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent-soft, #e8f1f4) 70%, white);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.82rem;
}

.table-sort-caption strong {
  color: var(--text, #1f2a2e);
  font-weight: 800;
}

.table-sort-caption .pi {
  color: var(--accent, #2f6f7e);
}
</style>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

withDefaults(
  defineProps<{
    cards?: number
  }>(),
  { cards: 8 },
)
</script>

<template>
  <div class="card-skeleton-grid" aria-busy="true" aria-label="جاري التحميل">
    <div v-for="n in cards" :key="n" class="card-skeleton">
      <div class="card-skeleton__top">
        <Skeleton shape="circle" size="2.75rem" />
        <Skeleton width="4.5rem" height="1.4rem" border-radius="999px" />
      </div>
      <Skeleton width="65%" height="1.15rem" class="mb" border-radius="8px" />
      <Skeleton width="90%" height="0.75rem" class="mb" border-radius="8px" />
      <Skeleton width="75%" height="0.75rem" class="mb" border-radius="8px" />
      <div class="card-skeleton__actions">
        <Skeleton height="2.5rem" border-radius="12px" />
        <Skeleton height="2.5rem" border-radius="12px" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.card-skeleton__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-skeleton__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}

.mb {
  display: block;
}
</style>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'
</script>

<template>
  <div class="detail-skeleton" aria-busy="true" aria-label="جاري التحميل">
    <div class="detail-skeleton__header">
      <Skeleton width="10rem" height="1.5rem" border-radius="8px" />
      <Skeleton width="16rem" height="0.85rem" border-radius="8px" class="mt-sm" />
    </div>
    <div class="detail-skeleton__grid">
      <div v-for="n in 8" :key="n" class="detail-skeleton__cell">
        <Skeleton width="4.5rem" height="0.7rem" border-radius="6px" />
        <Skeleton width="70%" height="1rem" border-radius="8px" class="mt-sm" />
      </div>
    </div>
    <div class="detail-skeleton__tabs">
      <Skeleton width="6rem" height="2.2rem" border-radius="10px" />
      <Skeleton width="6rem" height="2.2rem" border-radius="10px" />
    </div>
    <div class="detail-skeleton__media">
      <Skeleton v-for="n in 4" :key="n" height="8.5rem" border-radius="14px" />
    </div>
  </div>
</template>

<style scoped>
.detail-skeleton {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-skeleton__header,
.detail-skeleton__grid,
.detail-skeleton__media {
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
}

.detail-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.detail-skeleton__tabs {
  display: flex;
  gap: 10px;
}

.detail-skeleton__media {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mt-sm {
  margin-top: 8px;
  display: block;
}

@media (max-width: 900px) {
  .detail-skeleton__grid,
  .detail-skeleton__media {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'
</script>

<template>
  <div class="dash-skeleton" aria-busy="true" aria-label="جاري التحميل">
    <div class="dash-skeleton__hero">
      <div class="dash-skeleton__hero-copy">
        <Skeleton width="6rem" height="0.75rem" border-radius="6px" class="block" />
        <Skeleton width="min(100%, 28rem)" height="1.5rem" border-radius="8px" class="block mt" />
        <Skeleton width="min(100%, 20rem)" height="0.9rem" border-radius="8px" class="block mt" />
      </div>
      <div class="dash-skeleton__hero-metrics">
        <Skeleton v-for="n in 3" :key="n" width="6.5rem" height="4.2rem" border-radius="16px" />
      </div>
    </div>

    <div class="dash-skeleton__section">
      <Skeleton width="9rem" height="1.1rem" border-radius="8px" />
      <Skeleton width="14rem" height="0.8rem" border-radius="8px" class="mt-sm" />
      <div class="dash-skeleton__featured">
        <div v-for="n in 4" :key="n" class="feature-skel">
          <div class="feature-skel__top">
            <Skeleton width="3.2rem" height="3.2rem" border-radius="16px" />
            <Skeleton width="3.5rem" height="1.5rem" border-radius="999px" />
          </div>
          <Skeleton width="4.5rem" height="2rem" border-radius="8px" class="mt" />
          <Skeleton width="55%" height="0.95rem" border-radius="8px" class="mt" />
          <Skeleton width="80%" height="0.7rem" border-radius="8px" class="mt-sm" />
        </div>
      </div>
    </div>

    <div class="dash-skeleton__section">
      <Skeleton width="8rem" height="1.1rem" border-radius="8px" />
      <div class="dash-skeleton__metrics">
        <div v-for="n in 3" :key="n" class="metric-skel">
          <Skeleton width="3rem" height="3rem" border-radius="15px" />
          <div class="metric-skel__body">
            <Skeleton width="4rem" height="0.75rem" border-radius="6px" />
            <Skeleton width="3.5rem" height="1.35rem" border-radius="8px" class="mt-sm" />
            <Skeleton width="5rem" height="0.65rem" border-radius="6px" class="mt-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-skeleton {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.dash-skeleton__hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 22px;
  background: linear-gradient(135deg, #e8f1f3, #f4f8f9);
  border: 1px solid var(--border);
}

.dash-skeleton__hero-copy {
  flex: 1;
  min-width: 220px;
}

.dash-skeleton__hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dash-skeleton__section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dash-skeleton__featured {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.feature-skel {
  padding: 20px 18px;
  min-height: 188px;
  border-radius: 22px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.feature-skel__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dash-skeleton__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.metric-skel {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 18px 16px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: #fff;
}

.metric-skel__body {
  flex: 1;
}

.block { display: block; }
.mt { margin-top: 12px; display: block; }
.mt-sm { margin-top: 8px; display: block; }

@media (max-width: 1100px) {
  .dash-skeleton__featured {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dash-skeleton__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .dash-skeleton__featured,
  .dash-skeleton__metrics {
    grid-template-columns: 1fr;
  }
}
</style>

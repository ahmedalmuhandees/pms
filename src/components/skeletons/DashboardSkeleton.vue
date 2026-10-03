<script setup lang="ts">
import Skeleton from 'primevue/skeleton'
</script>

<template>
  <div class="dash-skeleton" aria-busy="true" aria-label="جاري التحميل">
    <div class="dash-skeleton__hero">
      <div class="dash-skeleton__hero-copy">
        <Skeleton width="6rem" height="0.75rem" border-radius="6px" class="block" />
        <Skeleton width="min(100%, 28rem)" height="1.5rem" border-radius="8px" class="block mt" />
        <Skeleton width="min(100%, 22rem)" height="0.9rem" border-radius="8px" class="block mt" />
      </div>
      <div class="dash-skeleton__hero-metrics">
        <Skeleton v-for="n in 4" :key="n" width="5.5rem" height="4.2rem" border-radius="16px" />
      </div>
    </div>

    <div class="dash-skeleton__kpis">
      <div v-for="n in 6" :key="n" class="kpi-skel">
        <Skeleton width="2.6rem" height="2.6rem" border-radius="13px" />
        <div class="kpi-skel__body">
          <Skeleton width="4.5rem" height="0.7rem" border-radius="6px" />
          <Skeleton width="3.5rem" height="1.3rem" border-radius="8px" class="mt-sm" />
          <Skeleton width="6rem" height="0.65rem" border-radius="6px" class="mt-sm" />
        </div>
      </div>
    </div>

    <div class="dash-skeleton__charts">
      <div v-for="n in 4" :key="n" class="chart-skel">
        <Skeleton width="9rem" height="1rem" border-radius="8px" />
        <Skeleton width="12rem" height="0.75rem" border-radius="8px" class="mt-sm" />
        <Skeleton width="100%" height="14rem" border-radius="14px" class="mt" />
      </div>
    </div>

    <div class="dash-skeleton__bottom">
      <div v-for="n in 3" :key="n" class="chart-skel">
        <Skeleton width="8rem" height="1rem" border-radius="8px" />
        <Skeleton width="100%" height="12rem" border-radius="14px" class="mt" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.dash-skeleton__kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.kpi-skel {
  display: flex;
  gap: 12px;
  padding: 16px 14px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.kpi-skel__body {
  flex: 1;
  min-width: 0;
}

.dash-skeleton__charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.dash-skeleton__bottom {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.chart-skel {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.block {
  display: block;
}

.mt {
  margin-top: 12px;
}

.mt-sm {
  margin-top: 8px;
}

@media (max-width: 1280px) {
  .dash-skeleton__kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dash-skeleton__bottom {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .dash-skeleton__charts,
  .dash-skeleton__bottom {
    grid-template-columns: 1fr;
  }

  .dash-skeleton__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .dash-skeleton__kpis {
    grid-template-columns: 1fr;
  }
}
</style>

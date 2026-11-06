<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const cards = computed(() => [
  { label: 'الاسم', value: auth.displayName || '—' },
  { label: 'الهاتف', value: auth.user?.phone || '—' },
  { label: 'الوحدة', value: auth.user?.unitNumber || '—' },
  { label: 'المجمع', value: auth.user?.complexName || '—' },
])
</script>

<template>
  <section class="home">
    <header class="hero">
      <p class="eyebrow">حساب الساكن</p>
      <h1>مرحباً، {{ auth.displayName }}</h1>
      <p class="lead">هذه نظرة سريعة على بيانات سكنك الحالية.</p>
    </header>

    <div class="grid">
      <article v-for="card in cards" :key="card.label" class="info">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  gap: 22px;
}

.hero {
  padding: 8px 4px 4px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #7a6a4a;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.lead {
  margin: 0;
  color: #5b665f;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.info {
  padding: 18px 18px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(31, 42, 36, 0.08);
  display: grid;
  gap: 8px;
}

.info span {
  color: #6b756f;
  font-size: 0.9rem;
}

.info strong {
  font-size: 1.15rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

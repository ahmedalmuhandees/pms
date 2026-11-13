<script setup lang="ts">
import { listComplexSlugs } from '@/config/complexes'

const slugs = listComplexSlugs()
</script>

<template>
  <div class="nf">
    <div class="nf__card">
      <div class="nf__code">404</div>
      <h1>المسار غير موجود</h1>
      <p>
        لم يتم تحديد مجمع صالح في الرابط.
        <br />
        تواصل مع الفريق التقني للحصول على رابط الدخول الصحيح.
      </p>
      <p class="nf__hint" v-if="slugs.length">
        أمثلة المسارات:
        <code v-for="s in slugs" :key="s">/{{ s }}</code>
      </p>
    </div>
  </div>
</template>

<style scoped>
.nf {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(ellipse at 20% 10%, rgba(11, 61, 74, 0.08), transparent 45%),
    linear-gradient(160deg, #eef3f5, #e4ecef);
  font-family: var(--font);
}

.nf__card {
  width: min(480px, 100%);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 36px 28px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.nf__code {
  font-size: 3rem;
  font-weight: 800;
  color: var(--brand-mid);
  letter-spacing: 0.04em;
  line-height: 1;
  margin-bottom: 12px;
}

h1 {
  margin: 0 0 10px;
  font-size: 1.35rem;
  color: var(--text-strong);
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  font-size: 0.98rem;
}

.nf__hint {
  margin-top: 18px;
  font-size: 0.85rem;
}

code {
  display: inline-block;
  margin: 6px 4px 0;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 700;
  direction: ltr;
}
</style>

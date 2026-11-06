<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.replace('/resident-login')
}
</script>

<template>
  <div class="resident-shell">
    <header class="resident-top">
      <div class="brand">
        <span class="mark">سك</span>
        <div>
          <strong>بوابة الساكن</strong>
          <p>{{ auth.user?.complexName || 'المجمع السكني' }}</p>
        </div>
      </div>
      <div class="top-actions">
        <span class="who">{{ auth.displayName }}</span>
        <Button label="تسجيل الخروج" severity="secondary" text @click="logout" />
      </div>
    </header>
    <main class="resident-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.resident-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(196, 149, 43, 0.16), transparent 40%),
    linear-gradient(180deg, #f4f1ea 0%, #ebe6dc 100%);
  color: #1f2a24;
}

.resident-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(31, 42, 36, 0.08);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #243f2c;
  color: #f4efe4;
  font-weight: 700;
}

.brand strong {
  display: block;
  font-size: 1.05rem;
}

.brand p {
  margin: 2px 0 0;
  color: #667069;
  font-size: 0.88rem;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.who {
  color: #4b5650;
  font-weight: 600;
}

.resident-main {
  width: min(920px, calc(100% - 32px));
  margin: 28px auto 40px;
}

@media (max-width: 640px) {
  .resident-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const notify = useNotify()

const loading = ref(false)
const form = reactive({
  email: '',
  password: '',
})

async function onSubmit() {
  if (!form.email || !form.password) {
    notify.warning('أدخل البريد وكلمة المرور')
    return
  }
  loading.value = true
  try {
    await auth.login({ email: form.email, password: form.password })
    notify.success('تم تسجيل الدخول بنجاح')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-atmosphere" aria-hidden="true">
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="grid-overlay" />
    </div>

    <div class="login-shell">
      <div class="login-aside">
        <div class="aside-mark">مج</div>
        <h1>إدارة المجمعات السكنية</h1>
        <p>منصة احترافية لإدارة المجمعات والوحدات والعملاء بكفاءة عالية.</p>
        <ul class="aside-points">
          <li>إدارة هرمية كاملة للمجمع</li>
          <li>متابعة الوحدات والحالات</li>
          <li>تنظيم العملاء والمستخدمين</li>
        </ul>
      </div>

      <div class="login-panel">
        <div class="panel-eyebrow">تسجيل الدخول</div>
        <div class="login-brand">مرحباً بعودتك</div>
        <p class="login-desc">أدخل بياناتك للوصول إلى لوحة التحكم</p>

        <form class="login-form" @submit.prevent="onSubmit">
          <div class="field">
            <label>البريد الإلكتروني</label>
            <InputText v-model="form.email" type="email" placeholder="أدخل البريد الإلكتروني" />
          </div>
          <div class="field">
            <label>كلمة المرور</label>
            <Password
              v-model="form.password"
              :feedback="false"
              toggle-mask
              placeholder="أدخل كلمة المرور"
              input-class="w-full"
              class="w-full"
            />
          </div>
          <Button type="submit" label="تسجيل الدخول" class="submit" :loading="loading" />
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  overflow: hidden;
  background: linear-gradient(145deg, #062830 0%, #0b3d4a 45%, #0a2f38 100%);
}

.login-atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
}

.orb-a {
  width: 380px;
  height: 380px;
  top: -80px;
  inset-inline-end: -60px;
  background: radial-gradient(circle, rgba(196, 107, 43, 0.45), transparent 68%);
}

.orb-b {
  width: 320px;
  height: 320px;
  bottom: -60px;
  inset-inline-start: -40px;
  background: radial-gradient(circle, rgba(31, 132, 148, 0.5), transparent 70%);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.login-aside {
  padding: 42px 36px;
  color: #f4fafb;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), transparent 50%);
}

.aside-mark {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  margin-bottom: 22px;
  background: rgba(255, 255, 255, 0.12);
}

.login-aside h1 {
  margin: 0 0 12px;
  font-size: 1.75rem;
  color: #fff;
}

.login-aside > p {
  margin: 0 0 28px;
  opacity: 0.82;
}

.aside-points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aside-points li {
  padding-inline-start: 18px;
  position: relative;
}

.aside-points li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.55em;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e8a066;
}

.login-panel {
  background: #fff;
  padding: 40px 34px;
}

.panel-eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--brand-mid);
  background: var(--brand-soft);
  padding: 4px 10px;
  border-radius: 8px;
  margin-bottom: 14px;
}

.login-brand {
  font-size: 1.55rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.login-desc {
  color: var(--muted);
  margin: 0 0 26px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-form :deep(.p-password),
.login-form :deep(.p-password-input) {
  width: 100%;
}

.submit {
  width: 100%;
  margin-top: 6px;
}

.w-full {
  width: 100%;
}

@media (max-width: 800px) {
  .login-shell {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { useComplexBrandStore } from '@/stores/complexBrand'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'

const auth = useAuthStore()
const brand = useComplexBrandStore()
const router = useRouter()
const notify = useNotify()

const pageStyle = computed(() => {
  const bg = brand.loginBackground
  if (!bg) return {}
  return {
    backgroundImage: `linear-gradient(145deg, color-mix(in srgb, ${brand.primaryColor} 72%, transparent), color-mix(in srgb, ${brand.primaryColor} 45%, transparent)), url(${bg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

const loading = ref(false)
const form = reactive({
  phone: '',
  code: '',
})

async function onSubmit() {
  if (!form.phone.trim() || !form.code.trim()) {
    notify.warning('أدخل رقم الهاتف ورمز الدخول')
    return
  }
  loading.value = true
  try {
    await auth.residentLogin({
      phone: form.phone.trim(),
      code: form.code.trim(),
      ...brand.loginScope(),
    })
    notify.success('تم تسجيل الدخول بنجاح')
    await router.replace('/resident-home')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page" :style="pageStyle">
    <div class="login-atmosphere" aria-hidden="true">
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="grid-overlay" />
    </div>

    <div class="login-shell">
      <div class="login-aside">
        <img v-if="brand.logo" class="aside-logo" :src="brand.logo" :alt="brand.name" />
        <div v-else class="aside-mark">سك</div>
        <h1>بوابة ساكني {{ brand.name }}</h1>
        <p>ادخل برقم هاتفك ورمز الدخول الذي حصلت عليه من إدارة المجمع.</p>
        <ul class="aside-points">
          <li>دخول آمن برقم الهاتف</li>
          <li>رمز خاص يصدره المدير</li>
          <li>عرض بيانات وحدتك بسهولة</li>
        </ul>
      </div>

      <div class="login-panel">
        <div class="panel-eyebrow">دخول الساكن</div>
        <div class="login-brand">مرحباً بك</div>
        <p class="login-desc">أدخل رقم الهاتف ورمز الدخول المكوّن من 6 أحرف</p>

        <form class="login-form" @submit.prevent="onSubmit">
          <div class="field">
            <label>رقم الهاتف</label>
            <InputText
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              placeholder="07XXXXXXXXX"
              autocomplete="tel"
            />
          </div>
          <div class="field">
            <label>رمز الدخول</label>
            <InputText
              v-model="form.code"
              maxlength="6"
              placeholder="******"
              class="code-input"
              autocomplete="one-time-code"
            />
          </div>
          <Button type="submit" label="تسجيل الدخول" class="submit" :loading="loading" />
        </form>

        <RouterLink class="alt-link" to="/login">دخول الموظفين والإدارة</RouterLink>
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
  background-color: var(--brand-dark, #16241b);
  background-repeat: no-repeat;
}

.aside-logo {
  width: 88px;
  height: 88px;
  object-fit: contain;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  padding: 8px;
  margin-bottom: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
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
  background: radial-gradient(circle, rgba(196, 149, 43, 0.4), transparent 68%);
}

.orb-b {
  width: 320px;
  height: 320px;
  bottom: -90px;
  inset-inline-start: -70px;
  background: radial-gradient(circle, rgba(74, 140, 98, 0.35), transparent 70%);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 42px 42px;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
}

.login-aside {
  padding: 42px 36px;
  color: #f4efe4;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), transparent 55%);
}

.aside-mark {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.35rem;
  background: #c4952b;
  color: #1a2e1f;
  margin-bottom: 22px;
}

.login-aside h1 {
  margin: 0 0 12px;
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  line-height: 1.25;
}

.login-aside p {
  margin: 0 0 22px;
  color: rgba(244, 239, 228, 0.78);
  line-height: 1.7;
}

.aside-points {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.aside-points li {
  position: relative;
  padding-inline-start: 18px;
  color: rgba(244, 239, 228, 0.88);
}

.aside-points li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.55em;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c4952b;
}

.login-panel {
  padding: 42px 36px;
  background: #f7f4ee;
  color: #1f2a24;
  display: flex;
  flex-direction: column;
}

.panel-eyebrow {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a6a4a;
  margin-bottom: 8px;
}

.login-brand {
  font-size: 1.7rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-desc {
  margin: 0 0 24px;
  color: #5b665f;
}

.login-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 0.92rem;
  font-weight: 600;
}

.field :deep(.p-inputtext),
.code-input {
  width: 100%;
}

.code-input :deep(input),
.field :deep(input) {
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.submit {
  margin-top: 6px;
}

.alt-link {
  margin-top: auto;
  padding-top: 22px;
  color: #3d6b4f;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 600;
}

.alt-link:hover {
  text-decoration: underline;
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-aside {
    display: none;
  }
}
</style>

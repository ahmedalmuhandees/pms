<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import type { Complex } from '@/types'
import { getComplexes } from '@/api/complexes'
import {
  getWhatsAppSettings,
  getWhatsAppStatus,
  requestWhatsAppPairCode,
  saveWhatsAppSettings,
  type WhatsAppStatus,
} from '@/api/whatsapp'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { asSelectOptions } from '@/utils/enums'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'

type TemplateKey = 'paymentReceiptTemplate' | 'installmentReminderTemplate' | 'paymentDetailsTemplate'

const notify = useNotify()
const auth = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const pairing = ref(false)
const checking = ref(false)
const complexes = ref<Complex[]>([])
const selectedComplexId = ref<string | null>(null)
const pairCode = ref<string | null>(null)
const status = ref<WhatsAppStatus | null>(null)
const activeTemplate = ref<TemplateKey>('paymentReceiptTemplate')

const form = reactive({
  phoneNumber: '+964',
  isEnabled: true,
  paymentReceiptTemplate: '',
  installmentReminderTemplate: '',
  paymentDetailsTemplate: '',
})

const templateTabs: { key: TemplateKey; title: string; subtitle: string; icon: string }[] = [
  {
    key: 'paymentReceiptTemplate',
    title: 'رسالة الدفع',
    subtitle: 'مقدمة · استلام · أقساط',
    icon: 'pi pi-wallet',
  },
  {
    key: 'installmentReminderTemplate',
    title: 'تنبيه القسط',
    subtitle: 'تذكير بالاستحقاق',
    icon: 'pi pi-bell',
  },
  {
    key: 'paymentDetailsTemplate',
    title: 'تفاصيل الدفعات',
    subtitle: 'كشف المدفوع والمتبقي',
    icon: 'pi pi-list',
  },
]

const templateVars = [
  { key: 'customerName', label: 'اسم العميل' },
  { key: 'phone', label: 'رقم الهاتف' },
  { key: 'amount', label: 'مبلغ الدفع' },
  { key: 'paymentDate', label: 'تاريخ الدفع' },
  { key: 'purpose', label: 'نوع الدفعة' },
  { key: 'reference', label: 'رقم المرجع' },
  { key: 'paidTotal', label: 'إجمالي المدفوع' },
  { key: 'remainingTotal', label: 'إجمالي المتبقي' },
  { key: 'nextAmount', label: 'مبلغ القسط القادم' },
  { key: 'nextDueDate', label: 'تاريخ الاستحقاق' },
  { key: 'nextInstallmentLabel', label: 'اسم القسط القادم' },
  { key: 'paymentDetails', label: 'قائمة الدفعات' },
  { key: 'installmentDetails', label: 'قائمة الأقساط' },
  { key: 'complexName', label: 'اسم المجمع' },
  { key: 'contractNumber', label: 'رقم العقد' },
]

const editorRefs: Record<TemplateKey, HTMLTextAreaElement | null> = {
  paymentReceiptTemplate: null,
  installmentReminderTemplate: null,
  paymentDetailsTemplate: null,
}

function setEditorRef(key: TemplateKey, el: unknown) {
  const node = el as { $el?: HTMLElement } | HTMLElement | null
  if (!node) {
    editorRefs[key] = null
    return
  }
  const root = '$el' in node && node.$el ? node.$el : (node as HTMLElement)
  editorRefs[key] = root.querySelector?.('textarea') ?? (root as HTMLTextAreaElement)
}

const activeTabMeta = computed(
  () => templateTabs.find((t) => t.key === activeTemplate.value) ?? templateTabs[0],
)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const statusLabel = computed(() => {
  if (!status.value) return 'غير معروف'
  if (status.value.isLoggedIn) return 'متصل ومسجّل الدخول'
  if (status.value.isConnected) return 'متصل — بانتظار تسجيل الدخول'
  return 'غير متصل'
})

const statusClass = computed(() => {
  if (!status.value) return ''
  if (status.value.isLoggedIn) return 'is-ok'
  if (status.value.isConnected) return 'is-warn'
  return 'is-bad'
})

function normalizePhoneInput(value: string) {
  let v = value.trim().replace(/\s+/g, '')
  if (!v.startsWith('+')) {
    if (v.startsWith('964')) v = `+${v}`
    else if (v.startsWith('07')) v = `+964${v.slice(1)}`
    else if (v.startsWith('7')) v = `+964${v}`
    else v = `+964${v.replace(/^\+?/, '')}`
  }
  return v
}

function insertVariable(varKey: string) {
  const token = `{{${varKey}}}`
  const field = activeTemplate.value
  const el = editorRefs[field]
  const current = form[field] ?? ''

  if (el && typeof el.selectionStart === 'number') {
    const start = el.selectionStart
    const end = el.selectionEnd
    form[field] = current.slice(0, start) + token + current.slice(end)
    void nextTick(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  } else {
    form[field] = current + (current && !current.endsWith('\n') && !current.endsWith(' ') ? ' ' : '') + token
  }
}

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  const all = result.items ?? []
  if (auth.isSuperAdmin) {
    complexes.value = all
  } else {
    const mine = auth.user?.complexId
    complexes.value = mine ? all.filter((c) => c.id === mine) : all
  }
  if (!selectedComplexId.value) {
    selectedComplexId.value = auth.user?.complexId || complexes.value[0]?.id || null
  }
}

async function loadSettings() {
  loading.value = true
  try {
    await loadComplexes()
    const data = await getWhatsAppSettings(selectedComplexId.value)
    form.phoneNumber = data.phoneNumber || '+964'
    form.isEnabled = data.isEnabled !== false
    form.paymentReceiptTemplate = data.paymentReceiptTemplate || ''
    form.installmentReminderTemplate = data.installmentReminderTemplate || ''
    form.paymentDetailsTemplate = data.paymentDetailsTemplate || ''
    pairCode.value = null
    status.value = null
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!selectedComplexId.value) {
    notify.warning('اختر المجمع أولاً')
    return
  }
  const phone = normalizePhoneInput(form.phoneNumber)
  if (!phone.startsWith('+964') || phone.length < 8) {
    notify.warning('رقم الهاتف يجب أن يبدأ بـ +964')
    return
  }
  saving.value = true
  try {
    const saved = await saveWhatsAppSettings({
      phoneNumber: phone,
      isEnabled: form.isEnabled,
      paymentReceiptTemplate: form.paymentReceiptTemplate,
      installmentReminderTemplate: form.installmentReminderTemplate,
      paymentDetailsTemplate: form.paymentDetailsTemplate,
      complexId: selectedComplexId.value,
    })
    form.phoneNumber = saved.phoneNumber
    form.paymentReceiptTemplate = saved.paymentReceiptTemplate || ''
    form.installmentReminderTemplate = saved.installmentReminderTemplate || ''
    form.paymentDetailsTemplate = saved.paymentDetailsTemplate || ''
    notify.success('تم حفظ إعدادات وقوالب واتساب لهذا المجمع')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function getPairCode() {
  if (!selectedComplexId.value) {
    notify.warning('اختر المجمع أولاً')
    return
  }
  const phone = normalizePhoneInput(form.phoneNumber)
  if (!phone.startsWith('+964')) {
    notify.warning('رقم الهاتف يجب أن يبدأ بـ +964')
    return
  }
  pairing.value = true
  try {
    await saveWhatsAppSettings({
      phoneNumber: phone,
      isEnabled: form.isEnabled,
      paymentReceiptTemplate: form.paymentReceiptTemplate,
      installmentReminderTemplate: form.installmentReminderTemplate,
      paymentDetailsTemplate: form.paymentDetailsTemplate,
      complexId: selectedComplexId.value,
    })
    const result = await requestWhatsAppPairCode(selectedComplexId.value)
    pairCode.value = result.pairCode || null
    notify.success(result.message || 'تم إنشاء كود الربط')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    pairing.value = false
  }
}

async function checkStatus() {
  checking.value = true
  try {
    status.value = await getWhatsAppStatus(selectedComplexId.value)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  void loadSettings()
})
</script>

<template>
  <div class="page">
    <PageHeader title="الإعدادات" subtitle="إعدادات النظام والتكاملات" />

    <nav class="settings-nav">
      <button type="button" class="settings-nav__item is-active">واتساب</button>
    </nav>

    <div v-if="loading" class="loading-box">
      <ProgressSpinner stroke-width="3" />
    </div>

    <template v-else>
      <div class="data-panel connect-panel">
        <div class="section-head">
          <h3 class="section-title">ربط واتساب حسب المجمع</h3>
          <span class="status-pill" :class="statusClass">{{ statusLabel }}</span>
        </div>

        <p class="hint">
          كل مجمع له رقم واتساب مستقل. أدخل الرقم بصيغة
          <strong>+964…</strong>
          واطلب كود الربط.
        </p>

        <div class="form-grid">
          <div class="field">
            <label>المجمع</label>
            <Select
              :disabled="!auth.canSelectComplex"
              v-model="selectedComplexId"
              :options="complexOptions"
              option-label="label"
              option-value="id"
              placeholder="اختر المجمع"
              checkmark
                            append-to="body"
              @update:model-value="loadSettings"
            />
          </div>
          <div class="field">
            <label>رقم هاتف واتساب</label>
            <InputText v-model="form.phoneNumber" placeholder="+9647XXXXXXXX" dir="ltr" />
          </div>
          <div class="field full partial-row">
            <Checkbox v-model="form.isEnabled" binary input-id="waEnabled" />
            <label for="waEnabled">تفعيل إرسال واتساب</label>
          </div>
        </div>

        <div v-if="pairCode" class="pair-box">
          <span>كود الربط</span>
          <strong dir="ltr">{{ pairCode }}</strong>
          <small>واتساب → الأجهزة المرتبطة → ربط جهاز → أدخل الكود</small>
        </div>

        <div class="actions-row">
          <Button label="حفظ" icon="pi pi-save" :loading="saving" @click="save" />
          <Button
            label="الحصول على الكود"
            icon="pi pi-qrcode"
            severity="help"
            outlined
            :loading="pairing"
            @click="getPairCode"
          />
          <Button
            label="تحقق من الحالة"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            :loading="checking"
            @click="checkStatus"
          />
        </div>
      </div>

      <div class="data-panel templates-panel">
        <div class="section-head">
          <div>
            <h3 class="section-title">قوالب الرسائل</h3>
            <p class="hint tight">اضغط على متغير لإدراجه في القالب الحالي</p>
          </div>
          <Button label="حفظ القوالب" icon="pi pi-save" size="small" :loading="saving" @click="save" />
        </div>

        <div class="tpl-tabs" role="tablist">
          <button
            v-for="tab in templateTabs"
            :key="tab.key"
            type="button"
            class="tpl-tab"
            :class="{ 'is-active': activeTemplate === tab.key }"
            @click="activeTemplate = tab.key"
          >
            <i :class="tab.icon" />
            <span>
              <strong>{{ tab.title }}</strong>
              <small>{{ tab.subtitle }}</small>
            </span>
          </button>
        </div>

        <div class="tpl-editor">
          <div class="tpl-editor__head">
            <h4>{{ activeTabMeta.title }}</h4>
            <small>{{ activeTabMeta.subtitle }}</small>
          </div>

          <div class="var-chips" aria-label="متغيرات القالب">
            <button
              v-for="item in templateVars"
              :key="item.key"
              type="button"
              class="var-chip"
              :title="`إدراج {{${item.key}}}`"
              @click="insertVariable(item.key)"
            >
              <span class="var-chip__ar">{{ item.label }}</span>
              <code class="var-chip__key">{{ item.key }}</code>
            </button>
          </div>

          <Textarea
            :key="activeTemplate"
            :ref="(el) => setEditorRef(activeTemplate, el)"
            v-model="form[activeTemplate]"
            class="tpl-textarea"
            rows="8"
            auto-resize
            placeholder="اكتب نص الرسالة… أو اضغط متغيراً أعلاه لإدراجه"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.settings-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}
.settings-nav__item {
  border: 0;
  border-radius: 10px;
  padding: 12px 16px;
  background: transparent;
  color: var(--muted);
  font-weight: 800;
  cursor: pointer;
}
.settings-nav__item.is-active {
  background: rgba(21, 101, 116, 0.12);
  color: #155f6e;
}
.connect-panel,
.templates-panel {
  margin-bottom: 16px;
}
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.section-title {
  margin: 0;
}
.hint {
  color: var(--muted);
  margin: 0 0 16px;
  line-height: 1.7;
}
.hint.tight {
  margin: 4px 0 0;
  font-size: 0.88rem;
}
.status-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  background: #eef2f3;
  color: var(--muted);
  white-space: nowrap;
}
.status-pill.is-ok {
  background: rgba(21, 128, 61, 0.12);
  color: #15803d;
}
.status-pill.is-warn {
  background: rgba(180, 120, 20, 0.12);
  color: #a16207;
}
.status-pill.is-bad {
  background: rgba(192, 57, 43, 0.12);
  color: #b91c1c;
}
.pair-box {
  display: grid;
  gap: 4px;
  margin: 14px 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed #155f6e;
  background: rgba(21, 101, 116, 0.06);
}
.pair-box strong {
  font-size: 1.6rem;
  letter-spacing: 0.12em;
  color: #155f6e;
}
.pair-box small {
  color: var(--muted);
}
.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.tpl-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 16px;
}
.tpl-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  background: #fafbfc;
  cursor: pointer;
  text-align: right;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.tpl-tab i {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(21, 101, 116, 0.1);
  color: #155f6e;
  flex-shrink: 0;
}
.tpl-tab span {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.tpl-tab strong {
  font-size: 0.92rem;
  color: #16333a;
}
.tpl-tab small {
  color: var(--muted);
  font-size: 0.75rem;
}
.tpl-tab.is-active {
  border-color: #155f6e;
  background: rgba(21, 101, 116, 0.08);
  box-shadow: 0 0 0 3px rgba(21, 101, 116, 0.08);
}
.tpl-editor {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fafb 100%);
}
.tpl-editor__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.tpl-editor__head h4 {
  margin: 0;
  font-size: 1rem;
  color: #155f6e;
}
.tpl-editor__head small {
  color: var(--muted);
}
.var-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.var-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(21, 101, 116, 0.18);
  border-radius: 999px;
  padding: 6px 10px 6px 8px;
  background: #fff;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}
.var-chip:hover {
  border-color: #155f6e;
  background: rgba(21, 101, 116, 0.06);
  transform: translateY(-1px);
}
.var-chip:active {
  transform: translateY(0);
}
.var-chip__ar {
  font-size: 0.82rem;
  font-weight: 700;
  color: #16333a;
}
.var-chip__key {
  font-size: 0.72rem;
  font-weight: 600;
  color: #155f6e;
  background: rgba(21, 101, 116, 0.1);
  border-radius: 999px;
  padding: 2px 7px;
  direction: ltr;
}
.tpl-textarea :deep(textarea) {
  min-height: 160px;
  line-height: 1.7;
  border-radius: 12px;
  background: #fff;
}
.loading-box {
  display: grid;
  place-items: center;
  min-height: 220px;
}
.partial-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field.full {
  grid-column: 1 / -1;
}
.field label {
  font-weight: 700;
  font-size: 0.88rem;
}
@media (max-width: 900px) {
  .tpl-tabs {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .section-head {
    flex-direction: column;
  }
}
</style>

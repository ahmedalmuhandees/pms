<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import PageHeader from '@/components/PageHeader.vue'
import {
  getWhatsAppSettings,
  saveWhatsAppSettings,
  type UpdateWhatsAppSettingsPayload,
  type WhatsAppSettings,
} from '@/api/whatsapp'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/auth'
import { asSelectOptions } from '@/utils/enums'
import type { Complex } from '@/types'

const auth = useAuthStore()
const notify = useNotify()
const loading = ref(true)
const saving = ref(false)
const complexes = ref<Complex[]>([])
const selectedComplexId = ref<string | null>(null)

const form = reactive({
  phoneNumber: '+964',
  isEnabled: true,
  installmentReminderTemplate: '',
  reminderDays: 3,
  alertTemplate: '',
  alertDays: 0,
  penaltyNoticeTemplate: '',
  penaltyDays: 7,
  autoSendEnabled: false,
  paymentReceiptTemplate: '',
  paymentDetailsTemplate: '',
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

function hydrate(s: WhatsAppSettings) {
  form.phoneNumber = s.phoneNumber || '+964'
  form.isEnabled = s.isEnabled
  form.installmentReminderTemplate = s.installmentReminderTemplate || ''
  form.reminderDays = s.reminderDays ?? 3
  form.alertTemplate = s.alertTemplate || ''
  form.alertDays = s.alertDays ?? 0
  form.penaltyNoticeTemplate = s.penaltyNoticeTemplate || ''
  form.penaltyDays = s.penaltyDays ?? 7
  form.autoSendEnabled = Boolean(s.autoSendEnabled)
  form.paymentReceiptTemplate = s.paymentReceiptTemplate || ''
  form.paymentDetailsTemplate = s.paymentDetailsTemplate || ''
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

async function load() {
  loading.value = true
  try {
    await loadComplexes()
    if (!selectedComplexId.value) {
      notify.warning('اختر المجمع أولاً')
      return
    }
    const s = await getWhatsAppSettings(selectedComplexId.value)
    hydrate(s)
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!selectedComplexId.value) {
    notify.warning('اختر المجمع أولاً')
    return
  }
  saving.value = true
  try {
    const payload: UpdateWhatsAppSettingsPayload = {
      phoneNumber: form.phoneNumber,
      isEnabled: form.isEnabled,
      installmentReminderTemplate: form.installmentReminderTemplate,
      reminderDays: form.reminderDays,
      alertTemplate: form.alertTemplate,
      alertDays: form.alertDays,
      penaltyNoticeTemplate: form.penaltyNoticeTemplate,
      penaltyDays: form.penaltyDays,
      autoSendEnabled: form.autoSendEnabled,
      paymentReceiptTemplate: form.paymentReceiptTemplate,
      paymentDetailsTemplate: form.paymentDetailsTemplate,
      complexId: selectedComplexId.value,
    }
    const saved = await saveWhatsAppSettings(payload)
    hydrate(saved)
    notify.success('تم حفظ إعدادات التنبيهات')
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    saving.value = false
  }
}

watch(selectedComplexId, () => {
  if (selectedComplexId.value) void load()
})

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="إعدادات التنبيهات" subtitle="قوالب تذكير / تنبيه / غرامة وعدد الأيام والإرسال التلقائي">
      <template #actions>
        <Button label="تحديث" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="load" />
        <Button label="حفظ" icon="pi pi-save" :loading="saving" @click="save" />
      </template>
    </PageHeader>

    <div class="panel">
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
                    class="w-full"
        />
      </div>

      <div class="row">
        <label>تفعيل الإرسال التلقائي من اللوحة</label>
        <ToggleSwitch v-model="form.autoSendEnabled" />
      </div>
      <p class="hint">
        عند التفعيل، تقوم الواجهة بفحص الأقساط المستحقة كل بضع دقائق وإرسال القالب المناسب تلقائياً (نفس مسار زر واتساب).
      </p>

      <section class="block">
        <h3>قالب تذكير</h3>
        <div class="field-inline">
          <label>أيام قبل الاستحقاق</label>
          <InputNumber v-model="form.reminderDays" :min="0" :use-grouping="false" />
        </div>
        <Textarea v-model="form.installmentReminderTemplate" rows="6" auto-resize class="w-full" />
      </section>

      <section class="block">
        <h3>قالب تنبيه</h3>
        <div class="field-inline">
          <label>أيام نسبة ليوم الاستحقاق (0 = يوم الاستحقاق)</label>
          <InputNumber v-model="form.alertDays" :min="0" :use-grouping="false" />
        </div>
        <Textarea v-model="form.alertTemplate" rows="6" auto-resize class="w-full" />
      </section>

      <section class="block">
        <h3>قالب تطبيق الغرامة</h3>
        <div class="field-inline">
          <label>أيام بعد الاستحقاق</label>
          <InputNumber v-model="form.penaltyDays" :min="0" :use-grouping="false" />
        </div>
        <Textarea v-model="form.penaltyNoticeTemplate" rows="6" auto-resize class="w-full" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
}
.block h3 {
  margin: 0 0 10px;
  color: var(--brand);
  font-size: 1rem;
}
.field-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.w-full {
  width: 100%;
}
</style>

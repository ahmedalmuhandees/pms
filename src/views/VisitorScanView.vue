<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { scanVisitorPass } from '@/api/visitors'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { formatDate } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import type { ScanVisitorPassResult } from '@/types'

const notify = useNotify()

const form = reactive({
  qrCodeToken: '',
  carModel: '',
  carPlateNumber: '',
})

const scanning = ref(false)
const cameraActive = ref(false)
const cameraError = ref('')
const result = ref<ScanVisitorPassResult | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

let stream: MediaStream | null = null
let detectTimer: number | null = null
let lastScanned = ''

const canScan = computed(() => form.qrCodeToken.trim().length > 0)

async function submitScan(token?: string) {
  const qrCodeToken = (token ?? form.qrCodeToken).trim()
  if (!qrCodeToken) {
    notify.warning('أدخل أو امسح رمز التصريح')
    return
  }
  scanning.value = true
  result.value = null
  try {
    const data = await scanVisitorPass({
      qrCodeToken,
      carModel: form.carModel.trim() || null,
      carPlateNumber: form.carPlateNumber.trim() || null,
    })
    result.value = data
    form.qrCodeToken = qrCodeToken
    notify.success(data.message || 'تم اعتماد دخول الزائر بنجاح')
    stopCamera()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    scanning.value = false
  }
}

function resetForm() {
  form.qrCodeToken = ''
  form.carModel = ''
  form.carPlateNumber = ''
  result.value = null
  lastScanned = ''
}

async function startCamera() {
  cameraError.value = ''
  result.value = null
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraError.value = 'الكاميرا غير مدعومة على هذا الجهاز'
      return
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    cameraActive.value = true
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    const video = videoRef.value
    if (!video) return
    video.srcObject = stream
    await video.play()
    beginDetectLoop()
  } catch {
    cameraError.value = 'تعذر فتح الكاميرا — استخدم الإدخال اليدوي'
    stopCamera()
  }
}

function stopCamera() {
  if (detectTimer != null) {
    window.clearInterval(detectTimer)
    detectTimer = null
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
  cameraActive.value = false
}

function beginDetectLoop() {
  // BarcodeDetector متوفر في Chromium / كثير من أجهزة الآيباد الحديثة
  const Detector = (window as unknown as { BarcodeDetector?: new (opts?: { formats: string[] }) => {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>
  } }).BarcodeDetector

  if (!Detector) {
    cameraError.value = 'مسح الكاميرا التلقائي غير مدعوم هنا — الصق الرمز يدوياً أو استخدم متصفح Chrome/Edge'
    return
  }

  const detector = new Detector({ formats: ['qr_code'] })
  detectTimer = window.setInterval(async () => {
    const video = videoRef.value
    if (!video || video.readyState < 2 || scanning.value) return
    try {
      const codes = await detector.detect(video)
      const value = codes[0]?.rawValue?.trim()
      if (!value || value === lastScanned) return
      lastScanned = value
      form.qrCodeToken = value
      await submitScan(value)
    } catch {
      /* تجاهل إطارات فاشلة */
    }
  }, 700)
}

onMounted(() => {
  // لا نفتح الكاميرا تلقائياً — يضغط الحارس زر البدء (صلاحيات المتصفح)
})

onBeforeUnmount(() => stopCamera())
</script>

<template>
  <div class="page scan-page">
    <PageHeader
      title="مسح تصريح الزائر"
      subtitle="لآيباد الحراسة — امسح رمز QR أو أدخل الرمز يدوياً ثم أكّد الدخول"
    >
      <template #actions>
        <Button
          v-if="!cameraActive"
          label="تشغيل الكاميرا"
          icon="pi pi-camera"
          @click="startCamera"
        />
        <Button
          v-else
          label="إيقاف الكاميرا"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="stopCamera"
        />
        <Button label="تصريح جديد" icon="pi pi-refresh" severity="help" outlined @click="resetForm" />
      </template>
    </PageHeader>

    <div class="scan-layout">
      <div class="data-panel camera-panel">
        <h3 class="section-title">الكاميرا</h3>
        <div class="video-wrap">
          <video v-show="cameraActive" ref="videoRef" class="video" playsinline muted />
          <div v-if="!cameraActive" class="video-placeholder">
            <i class="pi pi-qrcode" />
            <p>شغّل الكاميرا لمسح رمز التصريح</p>
          </div>
        </div>
        <p v-if="cameraError" class="hint warn">{{ cameraError }}</p>
        <p v-else class="hint">وجّه الكاميرا نحو QR الزائر — يُعتمد تلقائياً بعد المسح</p>
      </div>

      <div class="data-panel form-panel">
        <h3 class="section-title">بيانات المسح</h3>
        <div class="form-grid">
          <div class="field full">
            <label>رمز التصريح (QR)</label>
            <InputText v-model="form.qrCodeToken" class="w-full" placeholder="الصق الرمز أو امسحه" dir="ltr" />
          </div>
          <div class="field">
            <label>موديل السيارة (اختياري)</label>
            <InputText v-model="form.carModel" class="w-full" placeholder="تويوتا كورولا" />
          </div>
          <div class="field">
            <label>رقم اللوحة (اختياري)</label>
            <InputText v-model="form.carPlateNumber" class="w-full" placeholder="بغداد 12345" />
          </div>
        </div>
        <div class="actions">
          <Button
            label="تأكيد الدخول"
            icon="pi pi-check"
            class="confirm-btn"
            :loading="scanning"
            :disabled="!canScan"
            @click="submitScan()"
          />
        </div>

        <div v-if="result" class="result-card" :class="{ ok: result.success }">
          <div class="result-head">
            <i class="pi pi-verified" />
            <strong>{{ result.message }}</strong>
          </div>
          <div class="result-grid">
            <div><span>الزائر</span><strong>{{ result.visitorName }}</strong></div>
            <div><span>الساكن</span><strong>{{ result.residentName }}</strong></div>
            <div><span>الوحدة</span><strong>{{ result.unitNumber }}</strong></div>
            <div><span>البناية</span><strong>{{ result.building }}</strong></div>
            <div><span>السبب</span><strong>{{ result.visitReason || '—' }}</strong></div>
            <div><span>وقت الدخول</span><strong>{{ formatDate(result.usedAt) }}</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan-page {
  max-width: 1200px;
}
.scan-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1rem;
}
@media (max-width: 900px) {
  .scan-layout {
    grid-template-columns: 1fr;
  }
}
.data-panel {
  background: var(--p-content-background, #fff);
  border: 1px solid var(--p-content-border-color, #e5e7eb);
  border-radius: 12px;
  padding: 1rem 1.1rem 1.2rem;
}
.section-title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}
.video-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #0f172a;
  border-radius: 10px;
  overflow: hidden;
}
.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 0.5rem;
  color: #cbd5e1;
  text-align: center;
}
.video-placeholder .pi {
  font-size: 2.5rem;
}
.hint {
  margin: 0.65rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}
.hint.warn {
  color: #b45309;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field.full {
  grid-column: 1 / -1;
}
.field label {
  font-size: 0.85rem;
  color: #475569;
}
.actions {
  margin-top: 1rem;
}
.confirm-btn {
  width: 100%;
  min-height: 3rem;
  font-size: 1.05rem;
}
.result-card {
  margin-top: 1rem;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}
.result-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #166534;
}
.result-head .pi {
  font-size: 1.25rem;
}
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 0.75rem;
}
.result-grid span {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}
.result-grid strong {
  font-size: 0.95rem;
}
.w-full {
  width: 100%;
}
</style>

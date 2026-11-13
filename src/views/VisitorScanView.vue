<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import jsQR from 'jsqr'
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
const lastError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
const tokenInputRef = ref<InstanceType<typeof InputText> | null>(null)

let stream: MediaStream | null = null
let detectTimer: number | null = null
let lastScanned = ''
let canvas: HTMLCanvasElement | null = null

const canScan = computed(() => form.qrCodeToken.trim().length > 0)
const hasCarInfo = computed(
  () => form.carModel.trim().length > 0 || form.carPlateNumber.trim().length > 0,
)
const confirmLabel = computed(() => {
  if (result.value?.success && hasCarInfo.value) return 'حفظ بيانات السيارة'
  return 'تأكيد الدخول'
})

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return formatDate(value)
  }
}

async function submitScan(token?: string) {
  const qrCodeToken = (token ?? form.qrCodeToken).trim()
  if (!qrCodeToken) {
    notify.warning('أدخل أو امسح رمز التصريح')
    return
  }
  scanning.value = true
  result.value = null
  lastError.value = ''
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
    const message = getErrorMessage(error)
    lastError.value = message
    notify.error(message)
  } finally {
    scanning.value = false
  }
}

function resetForm() {
  form.qrCodeToken = ''
  form.carModel = ''
  form.carPlateNumber = ''
  result.value = null
  lastError.value = ''
  lastScanned = ''
  void nextTick(() => focusToken())
}

function focusToken() {
  const raw = tokenInputRef.value as unknown as { $el?: HTMLElement } | HTMLElement | null
  const el = raw && '$el' in (raw as object) ? (raw as { $el?: HTMLElement }).$el : (raw as HTMLElement | null)
  const input = el?.querySelector?.('input') ?? (el as HTMLInputElement | undefined)
  input?.focus?.()
}

async function startCamera() {
  cameraError.value = ''
  result.value = null
  lastError.value = ''
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraError.value = 'الكاميرا غير مدعومة على هذا الجهاز — استخدم الإدخال اليدوي'
      return
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })
    cameraActive.value = true
    await nextTick()
    const video = videoRef.value
    if (!video) return
    video.srcObject = stream
    await video.play()
    beginDetectLoop()
  } catch {
    cameraError.value = 'تعذر فتح الكاميرا — الصق الرمز يدوياً أو اسمح بالوصول للكاميرا'
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

function detectWithJsQr(video: HTMLVideoElement): string | null {
  if (!canvas) canvas = document.createElement('canvas')
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return null
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, w, h)
  const image = ctx.getImageData(0, 0, w, h)
  const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
  return code?.data?.trim() || null
}

function beginDetectLoop() {
  const Detector = (
    window as unknown as {
      BarcodeDetector?: new (opts?: { formats: string[] }) => {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>
      }
    }
  ).BarcodeDetector

  const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null
  if (!detector) {
    cameraError.value = 'المسح يعمل عبر jsQR — وجّه الكاميرا بثبات نحو الرمز'
  }

  detectTimer = window.setInterval(async () => {
    const video = videoRef.value
    if (!video || video.readyState < 2 || scanning.value) return
    try {
      let value = ''
      if (detector) {
        const codes = await detector.detect(video)
        value = codes[0]?.rawValue?.trim() || ''
      }
      if (!value) {
        value = detectWithJsQr(video) || ''
      }
      if (!value || value === lastScanned) return
      lastScanned = value
      form.qrCodeToken = value
      // لا نعتمد تلقائياً — يتيح للحارس إدخال السيارة ثم الضغط على تأكيد
      notify.info('تم قراءة الرمز — أدخل بيانات السيارة إن وجدت ثم اضغط تأكيد الدخول')
      stopCamera()
    } catch {
      /* تجاهل إطارات فاشلة */
    }
  }, 650)
}

onMounted(() => {
  void nextTick(() => focusToken())
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
          <video v-show="cameraActive" ref="videoRef" class="video" playsinline muted autoplay />
          <div v-if="!cameraActive" class="video-placeholder">
            <i class="pi pi-qrcode" />
            <p>شغّل الكاميرا لمسح رمز التصريح</p>
          </div>
          <div v-if="cameraActive" class="scan-frame" aria-hidden="true" />
        </div>
        <p v-if="cameraError" class="hint warn">{{ cameraError }}</p>
        <p v-else class="hint">وجّه الكاميرا نحو QR الزائر — بعد القراءة أدخل السيارة ثم أكّد الدخول</p>
      </div>

      <div class="data-panel form-panel">
        <h3 class="section-title">بيانات المسح</h3>
        <div class="form-grid">
          <div class="field full">
            <label>رمز التصريح (QR)</label>
            <InputText
              ref="tokenInputRef"
              v-model="form.qrCodeToken"
              class="w-full token-input"
              placeholder="الصق الرمز أو امسحه"
              dir="ltr"
              @keyup.enter="submitScan()"
            />
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
            :label="confirmLabel"
            :icon="result?.success && hasCarInfo ? 'pi pi-car' : 'pi pi-check'"
            class="confirm-btn"
            :loading="scanning"
            :disabled="!canScan"
            @click="submitScan()"
          />
        </div>

        <div v-if="result" class="result-card ok">
          <div class="result-head">
            <i class="pi pi-verified" />
            <strong>{{ result.message }}</strong>
          </div>
          <div class="result-grid">
            <div><span>الزائر</span><strong>{{ result.visitorName }}</strong></div>
            <div><span>الساكن</span><strong>{{ result.residentName }}</strong></div>
            <div><span>الوحدة</span><strong>{{ result.unitNumber }}</strong></div>
            <div><span>البناية</span><strong>{{ result.building || '—' }}</strong></div>
            <div><span>السبب</span><strong>{{ result.visitReason || '—' }}</strong></div>
            <div><span>وقت الدخول</span><strong>{{ formatDateTime(result.usedAt) }}</strong></div>
          </div>
        </div>

        <div v-else-if="lastError" class="result-card err">
          <div class="result-head">
            <i class="pi pi-times-circle" />
            <strong>{{ lastError }}</strong>
          </div>
          <p class="err-hint">تحقق من صلاحية التصريح أو امسح رمزاً آخر.</p>
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
.scan-frame {
  pointer-events: none;
  position: absolute;
  inset: 14%;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.35);
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
.token-input :deep(input),
.token-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.02em;
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
}
.result-card.ok {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}
.result-card.err {
  border: 1px solid #fecaca;
  background: #fef2f2;
}
.result-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.result-card.ok .result-head {
  color: #166534;
}
.result-card.err .result-head {
  color: #b91c1c;
  margin-bottom: 0.35rem;
}
.result-head .pi {
  font-size: 1.25rem;
}
.err-hint {
  margin: 0;
  color: #7f1d1d;
  font-size: 0.88rem;
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

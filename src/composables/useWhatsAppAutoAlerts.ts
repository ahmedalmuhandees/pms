import { onMounted, onUnmounted, ref } from 'vue'
import {
  getDueWhatsAppAlerts,
  getWhatsAppSettings,
  sendWhatsAppTemplate,
} from '@/api/whatsapp'

const POLL_MS = 3 * 60 * 1000

/** يفحص التنبيهات المستحقة ويرسلها تلقائياً إن كان AutoSend مفعّلاً */
export function useWhatsAppAutoAlerts() {
  const running = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  async function tick() {
    if (running.value) return
    running.value = true
    try {
      const settings = await getWhatsAppSettings()
      if (!settings?.autoSendEnabled || !settings.isEnabled) return
      const complexId = settings.complexId || undefined
      const due = await getDueWhatsAppAlerts(complexId)
      for (const item of due) {
        try {
          await sendWhatsAppTemplate({
            templateType: item.templateType,
            customerId: item.customerId,
            contractId: item.contractId,
            installmentId: item.installmentId,
            complexId: settings.complexId,
          })
        } catch {
          // تجاهل فشل عنصر واحد ومتابعة الباقي
        }
      }
    } catch {
      // صامت — لا نزعجب المستخدم أثناء التصفح
    } finally {
      running.value = false
    }
  }

  function start() {
    void tick()
    timer = setInterval(() => void tick(), POLL_MS)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  onMounted(start)
  onUnmounted(stop)

  return { running, tick }
}

import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

export function useNotify() {
  const toast = useToast()

  function success(detail: string, summary = 'نجاح') {
    toast.add({ severity: 'success', summary, detail, life: 2800 })
  }

  function error(detail: string, summary = 'خطأ') {
    toast.add({ severity: 'error', summary, detail, life: 4000 })
  }

  function warning(detail: string, summary = 'تنبيه') {
    toast.add({ severity: 'warn', summary, detail, life: 3200 })
  }

  function info(detail: string, summary = 'معلومة') {
    toast.add({ severity: 'info', summary, detail, life: 2800 })
  }

  return { success, error, warning, info, toast }
}

export function useConfirmAction() {
  const confirm = useConfirm()

  function ask(message: string, header = 'تأكيد'): Promise<boolean> {
    return new Promise((resolve) => {
      confirm.require({
        message,
        header,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
          label: 'إلغاء',
          severity: 'secondary',
          outlined: true,
        },
        acceptProps: {
          label: 'تأكيد',
          severity: 'danger',
        },
        accept: () => resolve(true),
        reject: () => resolve(false),
      })
    })
  }

  return { ask, confirm }
}

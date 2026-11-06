import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * نطاق المجمع للمستخدم غير السوبر أدمن:
 * - إخفاء فلاتر «اختر المجمع»
 * - تثبيت الطلبات على complexId المرتبط بالحساب
 */
export function useComplexScope() {
  const auth = useAuthStore()

  const isSuperAdmin = computed(() => auth.isSuperAdmin)

  /** يظهر فلتر/اختيار المجمع للسوبر أدمن فقط */
  const canSelectComplex = computed(() => auth.isSuperAdmin)

  /** مجمع المستخدم المثبت (مدير/موظف) */
  const scopedComplexId = computed(() =>
    auth.isSuperAdmin ? null : auth.user?.complexId || null,
  )

  const isComplexScoped = computed(() => Boolean(scopedComplexId.value))

  /** يدمج ComplexId في باراميترات الطلب إن وُجد نطاق مثبت */
  function withComplexScope<T extends Record<string, unknown>>(params?: T): T {
    const id = scopedComplexId.value
    if (!id) return (params ?? {}) as T
    return { ...(params ?? {}), ComplexId: id } as unknown as T
  }

  /** يفرض complexId على كائن النموذج عند الإنشاء/التعديل */
  function applyScopedComplexId<T extends { complexId?: string | null }>(form: T): T {
    const id = scopedComplexId.value
    if (id) form.complexId = id
    return form
  }

  return {
    auth,
    isSuperAdmin,
    canSelectComplex,
    scopedComplexId,
    isComplexScoped,
    withComplexScope,
    applyScopedComplexId,
  }
}

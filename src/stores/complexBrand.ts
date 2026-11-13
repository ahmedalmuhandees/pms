import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  applyComplexBrand,
  resolveComplexFromLocation,
  type ComplexBrandConfig,
} from '@/config/complexes'

const resolved = resolveComplexFromLocation()

export const useComplexBrandStore = defineStore('complexBrand', () => {
  const slug = ref<string | null>(resolved.slug)
  const base = ref(resolved.base)
  const config = ref<ComplexBrandConfig | null>(resolved.config)

  const name = computed(() => config.value?.name ?? 'إدارة المجمعات السكنية')
  const logo = computed(() => config.value?.logo ?? '/contract-assets/logo.png')
  const loginBackground = computed(() => config.value?.loginBackground ?? '')
  const primaryColor = computed(() => config.value?.primaryColor ?? '#0b3d4a')
  const complexId = computed(() => config.value?.complexId ?? '')
  const isKnownComplex = computed(() => Boolean(config.value))

  function apply() {
    applyComplexBrand(config.value)
  }

  /** يُرفق مع طلبات تسجيل الدخول لعزل بيانات المجمع */
  function loginScope() {
    return {
      complexSlug: slug.value || undefined,
      complexId: complexId.value || undefined,
    }
  }

  return {
    slug,
    base,
    config,
    name,
    logo,
    loginBackground,
    primaryColor,
    complexId,
    isKnownComplex,
    apply,
    loginScope,
  }
})

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPortal } from '@/api/auth'
import {
  applyComplexBrand,
  resolveComplexFromLocation,
  type ComplexBrandConfig,
} from '@/config/complexes'
import { resolveMediaUrl } from '@/utils/media'

const resolved = resolveComplexFromLocation()

export const useComplexBrandStore = defineStore('complexBrand', () => {
  const slug = ref<string | null>(resolved.slug)
  const base = ref(resolved.base)
  const config = ref<ComplexBrandConfig | null>(resolved.config)
  const portalLoaded = ref(false)
  const portalMissing = ref(false)

  const name = computed(() => config.value?.name ?? 'إدارة المجمعات السكنية')
  const logo = computed(() => config.value?.logo ?? '/contract-assets/logo.png')
  const loginBackground = computed(() => config.value?.loginBackground ?? '')
  const primaryColor = computed(() => config.value?.primaryColor ?? '#0b3d4a')
  const complexId = computed(() => config.value?.complexId ?? '')
  const isKnownComplex = computed(() => Boolean(slug.value))

  function apply() {
    applyComplexBrand(config.value)
  }

  function loginScope() {
    // سوبر أدمن يتجاهل الباكند هذه القيم؛ مدير/ساكن يحتاجها للعزل
    const id = complexId.value?.trim()
    return {
      complexSlug: slug.value || undefined,
      complexId: id || undefined,
    }
  }

  async function loadPortal() {
    if (!slug.value) {
      portalLoaded.value = true
      return
    }
    try {
      const portal = await getPortal(slug.value)
      const next: ComplexBrandConfig = {
        slug: portal.slug || slug.value,
        name: portal.nameAr || portal.name || config.value?.name || 'إدارة المجمعات السكنية',
        complexId: portal.complexId || '',
        primaryColor: portal.primaryColor || config.value?.primaryColor || '#0b3d4a',
        logo: resolveMediaUrl(portal.logoUrl) || config.value?.logo || '/contract-assets/logo.png',
        loginBackground:
          resolveMediaUrl(portal.loginBackgroundUrl) || config.value?.loginBackground || '',
      }
      config.value = next
      portalMissing.value = false
      apply()
    } catch {
      // ابقِ الاحتياطي المحلي؛ السوبر أدمن يدخل بدون مجمع موجود
      portalMissing.value = !complexId.value
    } finally {
      portalLoaded.value = true
    }
  }

  return {
    slug,
    base,
    config,
    portalLoaded,
    portalMissing,
    name,
    logo,
    loginBackground,
    primaryColor,
    complexId,
    isKnownComplex,
    apply,
    loginScope,
    loadPortal,
  }
})

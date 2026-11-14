/**
 * خريطة إعدادات المجمعات — المسار الأول في الدومين يحدد المجمع.
 * مثال: https://complex.solidcode-iq.com/zhsc
 *
 * القيم هنا احتياطية محلية؛ المصدر الأساسي بعد التحميل هو
 * GET /api/Auth/portal/{slug} (من حقول المجمع في قاعدة البيانات).
 */
export interface ComplexBrandConfig {
  /** مفتاح المسار */
  slug: string
  /** الاسم الظاهر */
  name: string
  /** معرّف المجمع في قاعدة البيانات */
  complexId: string
  /** اللون الأساسي */
  primaryColor: string
  /** شعار المجمع */
  logo: string
  /** خلفية صفحة تسجيل الدخول */
  loginBackground: string
}

/** احتياطي ثابت للمجمعات المعروفة قبل جلب API */
export const COMPLEX_MAP: Record<string, ComplexBrandConfig> = {
  zhsc: {
    slug: 'zhsc',
    name: 'مجمع الزهراء السكني',
    complexId: '',
    primaryColor: '#09413c',
    logo: '/contract-assets/alzahraa/logoalzahraa.png',
    loginBackground: '/contract-assets/alzahraa/bachalzahraa.svg',
  },
  hads: {
    slug: 'hads',
    name: 'مجمع الهادي السكني',
    complexId: '',
    primaryColor: '#1a1b31',
    logo: '/contract-assets/alhadee/logoalhadee.svg',
    loginBackground: '/contract-assets/alhadee/backalhadee.svg',
  },
}

const SLUG_RE = /^[a-z0-9]{2,32}$/

export function isValidPortalSlug(slug: string | null | undefined): boolean {
  if (!slug) return false
  return SLUG_RE.test(slug.trim().toLowerCase())
}

export function getComplexConfig(slug: string | null | undefined): ComplexBrandConfig | null {
  if (!slug) return null
  const key = slug.toLowerCase()
  return COMPLEX_MAP[key] ?? null
}

export function listComplexSlugs(): string[] {
  return Object.keys(COMPLEX_MAP)
}

export interface ResolvedComplexLocation {
  slug: string | null
  base: string
  config: ComplexBrandConfig | null
}

/** يستخرج مفتاح المجمع من أول جزء في المسار (أي slug صالح، ليس فقط القائمة الثابتة) */
export function resolveComplexFromLocation(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
): ResolvedComplexLocation {
  const parts = pathname.split('/').filter(Boolean)
  const maybe = parts[0]?.toLowerCase() ?? ''
  if (!isValidPortalSlug(maybe)) {
    return { slug: null, base: '/', config: null }
  }
  const fallback = getComplexConfig(maybe)
  return {
    slug: maybe,
    base: `/${maybe}/`,
    config: fallback ?? {
      slug: maybe,
      name: 'إدارة المجمعات السكنية',
      complexId: '',
      primaryColor: '#0b3d4a',
      logo: '/contract-assets/logo.png',
      loginBackground: '',
    },
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace('#', '').trim()
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function mixHex(hex: string, withColor: { r: number; g: number; b: number }, amount: number): string {
  const base = hexToRgb(hex)
  if (!base) return hex
  const t = Math.min(1, Math.max(0, amount))
  const r = Math.round(base.r + (withColor.r - base.r) * t)
  const g = Math.round(base.g + (withColor.g - base.g) * t)
  const b = Math.round(base.b + (withColor.b - base.b) * t)
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

/** يطبّق ألوان المجمع على :root */
export function applyComplexBrand(config: ComplexBrandConfig | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!config) {
    root.style.removeProperty('--brand')
    root.style.removeProperty('--brand-mid')
    root.style.removeProperty('--brand-light')
    root.style.removeProperty('--brand-dark')
    root.style.removeProperty('--brand-soft')
    root.style.removeProperty('--brand-glow')
    root.dataset.complex = ''
    return
  }

  const primary = config.primaryColor
  const mid = mixHex(primary, { r: 255, g: 255, b: 255 }, 0.18)
  const light = mixHex(primary, { r: 255, g: 255, b: 255 }, 0.32)
  const dark = mixHex(primary, { r: 0, g: 0, b: 0 }, 0.28)
  const soft = mixHex(primary, { r: 255, g: 255, b: 255 }, 0.9)
  const rgb = hexToRgb(primary)

  root.style.setProperty('--brand', primary)
  root.style.setProperty('--brand-mid', mid)
  root.style.setProperty('--brand-light', light)
  root.style.setProperty('--brand-dark', dark)
  root.style.setProperty('--brand-soft', soft)
  if (rgb) {
    root.style.setProperty('--brand-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`)
  }

  // PrimeVue primary palette — حتى عناصر Aura تتبع لون المجمع
  const scale = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
  const mixes = [0.92, 0.8, 0.65, 0.45, 0.28, 0.12, 0, 0.18, 0.32, 0.48, 0.62]
  scale.forEach((step, i) => {
    const amount = mixes[i] ?? 0
    const hex =
      step <= 500
        ? mixHex(primary, { r: 255, g: 255, b: 255 }, amount)
        : mixHex(primary, { r: 0, g: 0, b: 0 }, amount)
    root.style.setProperty(`--p-primary-${step}`, hex)
  })
  root.style.setProperty('--p-primary-color', mid)
  root.style.setProperty('--p-primary-contrast-color', '#ffffff')
  root.style.setProperty('--p-primary-hover-color', primary)
  root.style.setProperty('--p-primary-active-color', dark)

  root.dataset.complex = config.slug
  document.title = config.name
}

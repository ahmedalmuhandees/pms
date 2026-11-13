/**
 * خريطة إعدادات المجمعات — المسار الأول في الدومين يحدد المجمع.
 * مثال: https://complex.solidcode-iq.com/zhsc
 */
export interface ComplexBrandConfig {
  /** مفتاح المسار (zhsc | hads) */
  slug: string
  /** الاسم الظاهر */
  name: string
  /** معرّف المجمع في قاعدة البيانات — يُرسل مع تسجيل الدخول لعزل الخصوصية */
  complexId: string
  /** اللون الأساسي */
  primaryColor: string
  /** شعار المجمع (مسار من public) */
  logo: string
  /** خلفية صفحة تسجيل الدخول */
  loginBackground: string
}

const zhscId =
  (import.meta.env.VITE_COMPLEX_ZHSC_ID as string | undefined)?.trim() ||
  '08df1fb2-f274-4c28-85ea-eb38f9d1a1c4'
const hadsId = (import.meta.env.VITE_COMPLEX_HADS_ID as string | undefined)?.trim() || ''

export const COMPLEX_MAP: Record<string, ComplexBrandConfig> = {
  zhsc: {
    slug: 'zhsc',
    name: 'مجمع الزهراء السكني',
    complexId: zhscId,
    primaryColor: '#09413c',
    logo: '/contract-assets/alzahraa/logoalzahraa.png',
    loginBackground: '/contract-assets/alzahraa/bachalzahraa.svg',
  },
  hads: {
    slug: 'hads',
    name: 'مجمع الهادي السكني',
    complexId: hadsId,
    primaryColor: '#1a1b31',
    logo: '/contract-assets/alhadee/logoalhadee.svg',
    loginBackground: '/contract-assets/alhadee/backalhadee.svg',
  },
}

export type ComplexSlug = keyof typeof COMPLEX_MAP

export function getComplexConfig(slug: string | null | undefined): ComplexBrandConfig | null {
  if (!slug) return null
  return COMPLEX_MAP[slug.toLowerCase()] ?? null
}

export function listComplexSlugs(): string[] {
  return Object.keys(COMPLEX_MAP)
}

export interface ResolvedComplexLocation {
  /** مفتاح المجمع إن وُجد */
  slug: string | null
  /** قاعدة Vue Router مثل /zhsc/ */
  base: string
  /** إعدادات العلامة إن وُجدت */
  config: ComplexBrandConfig | null
}

/** يستخرج مفتاح المجمع من أول جزء في المسار */
export function resolveComplexFromLocation(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
): ResolvedComplexLocation {
  const parts = pathname.split('/').filter(Boolean)
  const maybe = parts[0]?.toLowerCase() ?? ''
  const config = getComplexConfig(maybe)
  if (!config) {
    return { slug: null, base: '/', config: null }
  }
  return {
    slug: config.slug,
    base: `/${config.slug}/`,
    config,
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
  root.dataset.complex = config.slug
  document.title = config.name
}

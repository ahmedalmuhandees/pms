import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import { getStoredAuthKind, getStoredToken, setStoredAuthKind, setStoredToken } from '@/api/client'
import type { LoginRequest, ResidentLoginRequest, UserInfo } from '@/types'
import { ALL_PAGE_KEYS, firstAllowedPath } from '@/utils/pagePermissions'

const USER_KEY = 'pms_user'

function loadUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

function persistUser(u: UserInfo | null) {
  if (!u) {
    localStorage.removeItem(USER_KEY)
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(u))
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken())
  const user = ref<UserInfo | null>(loadUser())
  const authKind = ref<'staff' | 'resident'>(
    user.value?.authKind === 'resident' || getStoredAuthKind() === 'resident'
      ? 'resident'
      : 'staff',
  )

  const isAuthenticated = computed(() => Boolean(token.value))
  const isResident = computed(
    () => authKind.value === 'resident' || user.value?.authKind === 'resident',
  )
  const isSuperAdmin = computed(() => !isResident.value && Boolean(user.value?.isSuperAdmin))
  const isComplexManager = computed(
    () =>
      !isResident.value &&
      !isSuperAdmin.value &&
      (user.value?.role === 'ComplexManager' || Boolean(user.value?.complexId)),
  )
  /** مجمع الحساب المثبت لمدير/موظف المجمع — null للسوبر أدمن */
  const scopedComplexId = computed(() =>
    isSuperAdmin.value ? null : user.value?.complexId || null,
  )
  /** السوبر أدمن فقط يختار مجمعاً من الفلاتر والنماذج */
  const canSelectComplex = computed(() => isSuperAdmin.value)
  const pages = computed<string[]>(() => {
    if (isResident.value) return []
    if (isSuperAdmin.value) return [...ALL_PAGE_KEYS]
    return user.value?.pages ?? []
  })
  const displayName = computed(() => {
    if (!user.value) return ''
    const name = [user.value.firstName, user.value.lastName].filter(Boolean).join(' ')
    return name || user.value.email || user.value.phone || 'مستخدم'
  })

  function canAccessPage(pageKey: string | null | undefined) {
    if (isResident.value) return false
    if (!pageKey) return true
    if (isSuperAdmin.value) return true
    // بدون صفحات محفوظة: اسمح مؤقتاً (توافق أدوار قديمة) بدل قفل الدخول
    if (!pages.value.length) return true
    return pages.value.includes(pageKey)
  }

  const homePath = computed(() => {
    if (isResident.value) return '/resident-home'
    if (isSuperAdmin.value) return '/'
    return firstAllowedPath(pages.value)
  })

  function applySession(data: { token: string | null; user: UserInfo }, kind: 'staff' | 'resident') {
    token.value = data.token
    authKind.value = kind
    user.value = {
      ...data.user,
      authKind: kind,
      pages: data.user.pages ?? [],
      roleName: data.user.roleName ?? data.user.role,
    }
    setStoredToken(data.token)
    setStoredAuthKind(kind)
    persistUser(user.value)
  }

  async function login(payload: LoginRequest) {
    const data = await authApi.login(payload)
    applySession(data, 'staff')
  }

  async function residentLogin(payload: ResidentLoginRequest) {
    const data = await authApi.residentLogin(payload)
    applySession(data, 'resident')
  }

  async function refreshMe() {
    if (!token.value) return
    try {
      const me = await authApi.getMe()
      const kind = me.authKind === 'resident' ? 'resident' : 'staff'
      authKind.value = kind
      user.value = {
        ...me,
        authKind: kind,
        pages: me.pages ?? [],
        roleName: me.roleName ?? me.role,
      }
      setStoredAuthKind(kind)
      persistUser(user.value)
    } catch {
      // تجاهل — قد يكون التوكن قديماً
    }
  }

  function logout() {
    token.value = null
    user.value = null
    authKind.value = 'staff'
    setStoredToken(null)
    setStoredAuthKind(null)
    persistUser(null)
  }

  return {
    token,
    user,
    authKind,
    isAuthenticated,
    isResident,
    isSuperAdmin,
    isComplexManager,
    scopedComplexId,
    canSelectComplex,
    pages,
    homePath,
    displayName,
    canAccessPage,
    login,
    residentLogin,
    refreshMe,
    logout,
  }
})

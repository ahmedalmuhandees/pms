import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import { getStoredToken, setStoredToken } from '@/api/client'
import type { LoginRequest, UserInfo } from '@/types'

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

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken())
  const user = ref<UserInfo | null>(loadUser())

  const isAuthenticated = computed(() => Boolean(token.value))
  const displayName = computed(() => {
    if (!user.value) return ''
    const name = [user.value.firstName, user.value.lastName].filter(Boolean).join(' ')
    return name || user.value.email || 'مستخدم'
  })

  async function login(payload: LoginRequest) {
    const data = await authApi.login(payload)
    token.value = data.token
    user.value = data.user
    setStoredToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value = null
    setStoredToken(null)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isAuthenticated,
    displayName,
    login,
    logout,
  }
})

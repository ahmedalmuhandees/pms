<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'sidebar-groups-open'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

type MenuItem = { path: string; label: string; icon: string }
type MenuGroup = {
  key: string
  label: string | null
  collapsible: boolean
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    key: 'dashboard',
    label: null,
    collapsible: false,
    items: [{ path: '/', label: 'لوحة التحكم', icon: 'pi pi-chart-bar' }],
  },
  {
    key: 'structure',
    label: 'الهيكل العقاري',
    collapsible: true,
    items: [
      { path: '/complexes', label: 'المجمعات', icon: 'pi pi-building' },
      { path: '/complex-builder', label: 'هيكل عمودي', icon: 'pi pi-building' },
      { path: '/horizontal-builder', label: 'هيكل أفقي', icon: 'pi pi-home' },
      { path: '/complex-map', label: 'خريطة المجمع', icon: 'pi pi-map' },
      { path: '/blocks', label: 'البلوكات', icon: 'pi pi-th-large' },
      { path: '/buildings', label: 'المباني', icon: 'pi pi-home' },
      { path: '/floors', label: 'الطوابق', icon: 'pi pi-bars' },
      { path: '/units', label: 'الوحدات', icon: 'pi pi-key' },
    ],
  },
  {
    key: 'people',
    label: 'التشغيل',
    collapsible: true,
    items: [
      { path: '/customers', label: 'العملاء', icon: 'pi pi-users' },
      { path: '/employees', label: 'الموظفون', icon: 'pi pi-id-card' },
      { path: '/residents', label: 'السكان', icon: 'pi pi-home' },
      { path: '/technicians', label: 'الفنيون', icon: 'pi pi-wrench' },
      { path: '/vehicles', label: 'المركبات', icon: 'pi pi-car' },
      { path: '/visitors', label: 'الزوار', icon: 'pi pi-envelope' },
      { path: '/users', label: 'المستخدمون', icon: 'pi pi-user' },
    ],
  },
]

function loadOpenState(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {}
  for (const group of menuGroups) {
    if (group.collapsible) defaults[group.key] = true
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...(JSON.parse(raw) as Record<string, boolean>) }
  } catch {
    return defaults
  }
}

const openGroups = reactive(loadOpenState())

const activePath = computed(() => route.path)

function isActive(path: string) {
  if (path === '/') return activePath.value === '/'
  return activePath.value === path || activePath.value.startsWith(`${path}/`)
}

function groupHasActive(group: MenuGroup) {
  return group.items.some((item) => isActive(item.path))
}

function isOpen(group: MenuGroup) {
  if (!group.collapsible) return true
  return openGroups[group.key] !== false
}

function toggleGroup(group: MenuGroup) {
  if (!group.collapsible) return
  openGroups[group.key] = !isOpen(group)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...openGroups }))
}

watch(
  () => route.path,
  () => {
    for (const group of menuGroups) {
      if (group.collapsible && groupHasActive(group)) {
        openGroups[group.key] = true
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...openGroups }))
      }
    }
  },
  { immediate: true },
)

function logout() {
  auth.logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-glow" aria-hidden="true" />
      <div class="brand">
        <div class="brand-mark">مج</div>
        <div>
          <div class="brand-title">إدارة المجمعات</div>
          <div class="brand-sub">نظام إدارة العقارات</div>
        </div>
      </div>

      <nav class="menu">
        <div
          v-for="group in menuGroups"
          :key="group.key"
          class="menu-group"
          :class="{ 'is-collapsed': group.collapsible && !isOpen(group) }"
        >
          <button
            v-if="group.label"
            type="button"
            class="menu-group__toggle"
            :aria-expanded="isOpen(group)"
            @click="toggleGroup(group)"
          >
            <span class="menu-group__label">{{ group.label }}</span>
            <span class="menu-group__meta">
              <span v-if="groupHasActive(group) && !isOpen(group)" class="menu-group__active-dot" />
              <i
                class="pi pi-chevron-down menu-group__chevron"
                :class="{ 'is-open': isOpen(group) }"
              />
            </span>
          </button>

          <div v-show="isOpen(group)" class="menu-group__items">
            <RouterLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="menu-item"
              :class="{ active: isActive(item.path) }"
            >
              <span class="menu-icon"><i :class="item.icon" /></span>
              <span>{{ item.label }}</span>
              <span v-if="isActive(item.path)" class="menu-dot" />
            </RouterLink>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-label">لوحة تشغيل احترافية</div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="welcome-block">
          <span class="welcome-label">مرحباً بك</span>
          <span class="welcome">{{ auth.displayName }}</span>
        </div>
        <Button
          label="تسجيل الخروج"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          @click="logout"
        />
      </header>
      <main class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="view" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
  padding: 22px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #f4fafb;
  background: linear-gradient(165deg, #0b3d4a 0%, #0a3440 48%, #062830 100%);
  overflow: hidden;
  box-shadow: -8px 0 32px rgba(6, 40, 48, 0.12);
}

.sidebar-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(196, 107, 43, 0.28), transparent 70%);
  top: -60px;
  inset-inline-start: -40px;
  pointer-events: none;
}

.brand {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 800;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.brand-title {
  font-weight: 800;
  font-size: 1rem;
}

.brand-sub {
  opacity: 0.72;
  font-size: 0.78rem;
  margin-top: 2px;
}

.menu {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  padding-inline-end: 2px;
}

.menu-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-group__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(244, 250, 251, 0.55);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease, color 0.2s ease;
}

.menu-group__toggle:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(244, 250, 251, 0.9);
}

.menu-group__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.menu-group__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.menu-group__chevron {
  font-size: 0.7rem;
  opacity: 0.7;
  transition: transform 0.22s ease;
  transform: rotate(90deg);
}

.menu-group__chevron.is-open {
  transform: rotate(0deg);
}

.menu-group__active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8a066;
}

.menu-group__items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  color: rgba(244, 250, 251, 0.78);
  font-weight: 600;
  font-size: 0.94rem;
  transition: 0.25s ease;
}

.menu-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}

.menu-item:hover,
.menu-item.active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.menu-dot {
  margin-inline-start: auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e8a066;
}

.sidebar-footer {
  position: relative;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-label {
  font-size: 0.78rem;
  opacity: 0.7;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 26px;
  background: rgba(255, 255, 255, 0.78);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px) saturate(1.2);
  position: sticky;
  top: 0;
  z-index: 20;
}

.welcome-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-label {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 600;
}

.welcome {
  font-weight: 800;
  color: var(--text-strong);
}

.content {
  padding: 26px;
}

.view-enter-active,
.view-leave-active {
  transition: opacity 0.28s var(--ease);
}

.view-enter-from,
.view-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: static;
  }

  .menu {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }

  .menu-group {
    flex: 1 1 220px;
  }

  .content {
    padding: 16px;
  }
}
</style>

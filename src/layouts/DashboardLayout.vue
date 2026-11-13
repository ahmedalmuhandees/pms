<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { useComplexBrandStore } from '@/stores/complexBrand'
import { useWhatsAppAutoAlerts } from '@/composables/useWhatsAppAutoAlerts'
import type { PageKey } from '@/utils/pagePermissions'

useWhatsAppAutoAlerts()

const STORAGE_KEY = 'sidebar-groups-open'

const auth = useAuthStore()
const brand = useComplexBrandStore()
const route = useRoute()
const router = useRouter()

type MenuLink = { kind?: 'link'; path: string; label: string; icon: string; pageKey: PageKey }
type MenuSubmenu = {
  kind: 'submenu'
  key: string
  label: string
  icon: string
  children: MenuLink[]
}
type MenuEntry = MenuLink | MenuSubmenu
type MenuGroup = {
  key: string
  label: string | null
  collapsible: boolean
  items: MenuEntry[]
}

function isSubmenu(item: MenuEntry): item is MenuSubmenu {
  return (item as MenuSubmenu).kind === 'submenu'
}

const allMenuGroups: MenuGroup[] = [
  {
    key: 'dashboard',
    label: null,
    collapsible: false,
    items: [{ path: '/', label: 'لوحة التحكم', icon: 'pi pi-chart-bar', pageKey: 'dashboard' }],
  },
  {
    key: 'structure',
    label: 'الهيكل العقاري',
    collapsible: true,
    items: [
      { path: '/complexes', label: 'المجمعات', icon: 'pi pi-building', pageKey: 'complexes' },
      { path: '/complex-ads', label: 'إعلانات التطبيق', icon: 'pi pi-images', pageKey: 'complex-ads' },
      { path: '/agents', label: 'مدراء المجمعات', icon: 'pi pi-briefcase', pageKey: 'agents' },
      { path: '/complex-builder', label: 'هيكل عمودي', icon: 'pi pi-building', pageKey: 'complex-builder' },
      { path: '/horizontal-builder', label: 'هيكل أفقي', icon: 'pi pi-home', pageKey: 'horizontal-builder' },
      { path: '/complex-map', label: 'خريطة المجمع', icon: 'pi pi-map', pageKey: 'complex-map' },
      { path: '/blocks', label: 'البلوكات', icon: 'pi pi-th-large', pageKey: 'blocks' },
      { path: '/buildings', label: 'المباني', icon: 'pi pi-home', pageKey: 'buildings' },
      { path: '/floors', label: 'الطوابق', icon: 'pi pi-bars', pageKey: 'floors' },
      { path: '/units', label: 'الوحدات', icon: 'pi pi-key', pageKey: 'units' },
    ],
  },
  {
    key: 'people',
    label: 'التشغيل',
    collapsible: true,
    items: [
      { path: '/customers', label: 'العملاء', icon: 'pi pi-users', pageKey: 'customers' },
      { path: '/employees', label: 'الموظفون', icon: 'pi pi-id-card', pageKey: 'employees' },
      {
        kind: 'submenu',
        key: 'residents',
        label: 'السكان',
        icon: 'pi pi-home',
        children: [
          {
            path: '/residents',
            label: 'كل الساكنين',
            icon: 'pi pi-users',
            pageKey: 'residents',
          },
          {
            path: '/resident-contracts',
            label: 'عقود الساكنين',
            icon: 'pi pi-file',
            pageKey: 'resident-contracts',
          },
          {
            path: '/resident-buildings',
            label: 'بناية الساكنين',
            icon: 'pi pi-building',
            pageKey: 'resident-buildings',
          },
        ],
      },
      { path: '/technicians', label: 'الفنيون', icon: 'pi pi-wrench', pageKey: 'technicians' },
      { path: '/vehicles', label: 'المركبات', icon: 'pi pi-car', pageKey: 'vehicles' },
      {
        kind: 'submenu',
        key: 'visitors-group',
        label: 'الزوار',
        icon: 'pi pi-qrcode',
        children: [
          { path: '/visitors', label: 'سجل الزوار', icon: 'pi pi-list', pageKey: 'visitors' },
          {
            path: '/visitor-scan',
            label: 'مسح التصاريح',
            icon: 'pi pi-camera',
            pageKey: 'visitors',
          },
        ],
      },
      { path: '/users', label: 'المستخدمون', icon: 'pi pi-user', pageKey: 'users' },
      {
        kind: 'submenu',
        key: 'electricity',
        label: 'الكهرباء',
        icon: 'pi pi-bolt',
        children: [
          {
            path: '/electricity-invoices',
            label: 'فواتير الكهرباء',
            icon: 'pi pi-file-edit',
            pageKey: 'electricity-invoices',
          },
          {
            path: '/electricity-pricing',
            label: 'إعدادات التسعير',
            icon: 'pi pi-sliders-h',
            pageKey: 'electricity-pricing',
          },
          {
            path: '/electricity-reports',
            label: 'تقارير الكهرباء',
            icon: 'pi pi-chart-bar',
            pageKey: 'electricity-reports',
          },
        ],
      },
      {
        kind: 'submenu',
        key: 'gas',
        label: 'الغاز',
        icon: 'pi pi-sun',
        children: [
          {
            path: '/gas-invoices',
            label: 'فواتير الغاز',
            icon: 'pi pi-file-edit',
            pageKey: 'gas-invoices',
          },
          {
            path: '/gas-pricing',
            label: 'إعدادات التسعير',
            icon: 'pi pi-sliders-h',
            pageKey: 'gas-pricing',
          },
          {
            path: '/gas-reports',
            label: 'تقارير الغاز',
            icon: 'pi pi-chart-bar',
            pageKey: 'gas-reports',
          },
        ],
      },
      {
        kind: 'submenu',
        key: 'water',
        label: 'المياه',
        icon: 'pi pi-cloud',
        children: [
          {
            path: '/water-invoices',
            label: 'فواتير المياه',
            icon: 'pi pi-file-edit',
            pageKey: 'water-invoices',
          },
          {
            path: '/water-pricing',
            label: 'إعدادات التسعير',
            icon: 'pi pi-sliders-h',
            pageKey: 'water-pricing',
          },
          {
            path: '/water-reports',
            label: 'تقارير المياه',
            icon: 'pi pi-chart-bar',
            pageKey: 'water-reports',
          },
        ],
      },
      {
        kind: 'submenu',
        key: 'service',
        label: 'الخدمة',
        icon: 'pi pi-cog',
        children: [
          {
            path: '/monthly-invoices',
            label: 'فواتير الخدمة الشهرية',
            icon: 'pi pi-file-edit',
            pageKey: 'monthly-invoices',
          },
          {
            path: '/service-settings',
            label: 'إعدادات الخدمات الشهرية',
            icon: 'pi pi-sliders-h',
            pageKey: 'service-settings',
          },
        ],
      },
      {
        kind: 'submenu',
        key: 'expenses',
        label: 'المصاريف',
        icon: 'pi pi-wallet',
        children: [
          {
            path: '/expenses',
            label: 'إضافة المصاريف',
            icon: 'pi pi-plus-circle',
            pageKey: 'expenses',
          },
          {
            path: '/expenses-reports',
            label: 'تقارير المصاريف',
            icon: 'pi pi-chart-bar',
            pageKey: 'expenses-reports',
          },
        ],
      },
      {
        path: '/general-reports',
        label: 'التقارير العامة',
        icon: 'pi pi-chart-pie',
        pageKey: 'general-reports',
      },
      {
        path: '/audit-log',
        label: 'سجل الحركات والأحداث',
        icon: 'pi pi-history',
        pageKey: 'audit-log',
      },
    ],
  },
  {
    key: 'sales',
    label: 'المبيعات والمالية',
    collapsible: true,
    items: [
      { path: '/sales-contracts', label: 'عقود المبيعات', icon: 'pi pi-file', pageKey: 'sales-contracts' },
      { path: '/price-plans', label: 'خطط الأسعار', icon: 'pi pi-tag', pageKey: 'price-plans' },
      { path: '/contract-clauses', label: 'بنود العقد', icon: 'pi pi-align-left', pageKey: 'contract-clauses' },
      { path: '/contract-designs', label: 'تصاميم العقود', icon: 'pi pi-palette', pageKey: 'contract-designs' },
      { path: '/installments', label: 'الأقساط', icon: 'pi pi-list', pageKey: 'installments' },
      { path: '/reservations', label: 'الحجوزات', icon: 'pi pi-bookmark', pageKey: 'reservations' },
      { path: '/receipts', label: 'الوصولات', icon: 'pi pi-money-bill', pageKey: 'receipts' },
    ],
  },
  {
    key: 'settings',
    label: 'الإعدادات',
    collapsible: true,
    items: [
      { path: '/settings', label: 'واتساب', icon: 'pi pi-whatsapp', pageKey: 'settings' },
      { path: '/notification-settings', label: 'إعدادات التنبيهات', icon: 'pi pi-bell', pageKey: 'notification-settings' },
    ],
  },
]

const menuGroups = computed(() => {
  return allMenuGroups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => {
          if (!isSubmenu(item)) return item
          return {
            ...item,
            children: item.children.filter((child) => auth.canAccessPage(child.pageKey)),
          }
        })
        .filter((item) => (isSubmenu(item) ? item.children.length > 0 : auth.canAccessPage(item.pageKey))),
    }))
    .filter((group) => group.items.length > 0)
})

onMounted(async () => {
  // تحديث صفحات الصلاحيات من السيرفر (صفحات الغاز/المياه الجديدة وغيرها)
  await auth.refreshMe()
})

function loadOpenState(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {}
  for (const group of allMenuGroups) {
    if (group.collapsible) defaults[group.key] = true
    for (const item of group.items) {
      if (isSubmenu(item)) defaults[`sub:${item.key}`] = false
    }
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
  // لا تُفعَّل /visitors عند فتح /visitor-scan (كلاهما يبدأ بـ /visitor)
  if (activePath.value === path) return true
  if (activePath.value.startsWith(`${path}/`)) return true
  return false
}

function entryHasActive(item: MenuEntry) {
  if (isSubmenu(item)) return item.children.some((child) => isActive(child.path))
  return isActive(item.path)
}

function groupHasActive(group: MenuGroup) {
  return group.items.some((item) => entryHasActive(item))
}

function isOpen(group: MenuGroup) {
  if (!group.collapsible) return true
  return openGroups[group.key] !== false
}

function isSubmenuOpen(item: MenuSubmenu) {
  return openGroups[`sub:${item.key}`] === true
}

function toggleGroup(group: MenuGroup) {
  if (!group.collapsible) return
  openGroups[group.key] = !isOpen(group)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...openGroups }))
}

function toggleSubmenu(item: MenuSubmenu) {
  openGroups[`sub:${item.key}`] = !isSubmenuOpen(item)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...openGroups }))
}

function persistOpenState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...openGroups }))
}

watch(
  () => route.path,
  () => {
    for (const group of menuGroups.value) {
      if (group.collapsible && groupHasActive(group)) {
        openGroups[group.key] = true
      }
      for (const item of group.items) {
        if (isSubmenu(item) && entryHasActive(item)) {
          openGroups[`sub:${item.key}`] = true
        }
      }
    }
    persistOpenState()
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
        <img v-if="brand.logo" class="brand-logo" :src="brand.logo" :alt="brand.name" />
        <div v-else class="brand-mark">مج</div>
        <div>
          <div class="brand-title">{{ brand.name }}</div>
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
            <template v-for="item in group.items" :key="isSubmenu(item) ? item.key : item.path">
              <RouterLink
                v-if="!isSubmenu(item)"
                :to="item.path"
                class="menu-item"
                :class="{ active: isActive(item.path) }"
              >
                <span class="menu-icon"><i :class="item.icon" /></span>
                <span>{{ item.label }}</span>
                <span v-if="isActive(item.path)" class="menu-dot" />
              </RouterLink>

              <div v-else class="menu-submenu" :class="{ 'is-open': isSubmenuOpen(item) }">
                <button
                  type="button"
                  class="menu-item menu-submenu__toggle"
                  :class="{ active: entryHasActive(item) }"
                  :aria-expanded="isSubmenuOpen(item)"
                  @click="toggleSubmenu(item)"
                >
                  <span class="menu-icon"><i :class="item.icon" /></span>
                  <span>{{ item.label }}</span>
                  <i
                    class="pi pi-chevron-down menu-submenu__chevron"
                    :class="{ 'is-open': isSubmenuOpen(item) }"
                  />
                </button>
                <div v-show="isSubmenuOpen(item)" class="menu-submenu__items">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.path"
                    :to="child.path"
                    class="menu-item menu-item--child"
                    :class="{ active: isActive(child.path) }"
                  >
                    <span class="menu-icon"><i :class="child.icon" /></span>
                    <span>{{ child.label }}</span>
                    <span v-if="isActive(child.path)" class="menu-dot" />
                  </RouterLink>
                </div>
              </div>
            </template>
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

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.92);
  padding: 4px;
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

.menu-submenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-submenu__toggle {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: inherit;
}

.menu-submenu__chevron {
  margin-inline-start: auto;
  font-size: 0.7rem;
  opacity: 0.7;
  transition: transform 0.22s ease;
  transform: rotate(90deg);
}

.menu-submenu__chevron.is-open {
  transform: rotate(0deg);
}

.menu-submenu__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-inline-start: 0.55rem;
  margin-inline-start: 0.85rem;
  border-inline-start: 1px solid rgba(255, 255, 255, 0.12);
}

.menu-item--child {
  padding-block: 10px;
  font-size: 0.88rem;
}

.menu-item--child .menu-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
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

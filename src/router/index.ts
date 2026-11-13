import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resolveComplexFromLocation } from '@/config/complexes'
import { isStaleChunkError, reloadOnStaleChunk } from '@/utils/staleChunkReload'
import { pathToPageKey } from '@/utils/pagePermissions'

/** /zhsc أو /hads — وإلا تُعرض صفحة 404 */
export const complexLocation = resolveComplexFromLocation()

const notFoundRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'complex-not-found',
    component: () => import('@/views/ComplexNotFoundView.vue'),
    meta: { public: true },
  },
]

const appRoutes: RouteRecordRaw[] = [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('@/views/landing/ComplexLandingView.vue'),
      meta: { public: true },
    },
    {
      path: '/resident-login',
      name: 'resident-login',
      component: () => import('@/views/ResidentLoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/resident-home',
      component: () => import('@/layouts/ResidentLayout.vue'),
      meta: { requiresAuth: true, residentOnly: true },
      children: [
        {
          path: '',
          name: 'resident-home',
          component: () => import('@/views/ResidentHomeView.vue'),
          meta: { residentOnly: true },
        },
      ],
    },
    {
      path: '/sales-contracts/:id/print',
      name: 'sales-contract-print',
      component: () => import('@/views/SalesContractPrintView.vue'),
      meta: { requiresAuth: true, pageKey: 'sales-contracts' },
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true, staffOnly: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { pageKey: 'dashboard' },
        },
        {
          path: 'complexes',
          name: 'complexes',
          component: () => import('@/views/ComplexesView.vue'),
          meta: { pageKey: 'complexes' },
        },
        {
          path: 'complex-ads',
          name: 'complex-ads',
          component: () => import('@/views/ComplexAdsView.vue'),
          meta: { pageKey: 'complex-ads' },
        },
        {
          path: 'agents',
          name: 'agents',
          component: () => import('@/views/AgentsView.vue'),
          meta: { pageKey: 'agents' },
        },
        {
          path: 'complex-builder',
          name: 'complex-builder',
          component: () => import('@/views/ComplexBuilderView.vue'),
          meta: { builderLayout: 'vertical', pageKey: 'complex-builder' },
        },
        {
          path: 'horizontal-builder',
          name: 'horizontal-builder',
          component: () => import('@/views/ComplexBuilderView.vue'),
          meta: { builderLayout: 'horizontal', pageKey: 'horizontal-builder' },
        },
        {
          path: 'complex-map',
          name: 'complex-map',
          component: () => import('@/views/ComplexMapView.vue'),
          meta: { pageKey: 'complex-map' },
        },
        {
          path: 'blocks',
          name: 'blocks',
          component: () => import('@/views/BlocksView.vue'),
          meta: { pageKey: 'blocks' },
        },
        {
          path: 'buildings',
          name: 'buildings',
          component: () => import('@/views/BuildingsView.vue'),
          meta: { pageKey: 'buildings' },
        },
        {
          path: 'floors',
          name: 'floors',
          component: () => import('@/views/FloorsView.vue'),
          meta: { pageKey: 'floors' },
        },
        {
          path: 'units',
          name: 'units',
          component: () => import('@/views/UnitsView.vue'),
          meta: { pageKey: 'units' },
        },
        {
          path: 'units/:id',
          name: 'unit-detail',
          component: () => import('@/views/UnitDetailView.vue'),
          meta: { pageKey: 'units' },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/CustomersView.vue'),
          meta: { pageKey: 'customers' },
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: () => import('@/views/CustomerDetailView.vue'),
          meta: { pageKey: 'customers' },
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/views/EmployeesView.vue'),
          meta: { pageKey: 'employees' },
        },
        {
          path: 'residents',
          name: 'residents',
          component: () => import('@/views/ResidentsView.vue'),
          meta: { pageKey: 'residents' },
        },
        {
          path: 'residents/:id',
          name: 'resident-detail',
          component: () => import('@/views/ResidentDetailView.vue'),
          meta: { pageKey: 'residents' },
        },
        {
          path: 'resident-contracts',
          name: 'resident-contracts',
          component: () => import('@/views/ResidentContractsView.vue'),
          meta: { pageKey: 'resident-contracts' },
        },
        {
          path: 'resident-buildings',
          name: 'resident-buildings',
          component: () => import('@/views/ResidentBuildingsView.vue'),
          meta: { pageKey: 'resident-buildings' },
        },
        {
          path: 'technicians',
          name: 'technicians',
          component: () => import('@/views/TechniciansView.vue'),
          meta: { pageKey: 'technicians' },
        },

        {
          path: 'vehicles',
          name: 'vehicles',
          component: () => import('@/views/VehiclesView.vue'),
          meta: { pageKey: 'vehicles' },
        },
        {
          path: 'visitors',
          name: 'visitors',
          component: () => import('@/views/VisitorsView.vue'),
          meta: { pageKey: 'visitors' },
        },
        {
          path: 'visitor-scan',
          name: 'visitor-scan',
          component: () => import('@/views/VisitorScanView.vue'),
          meta: { pageKey: 'visitors' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { pageKey: 'users' },
        },
        {
          path: 'service-settings',
          name: 'service-settings',
          component: () => import('@/views/ServiceSettingsView.vue'),
          meta: { pageKey: 'service-settings' },
        },
        {
          path: 'monthly-services',
          name: 'monthly-services',
          component: () => import('@/views/MonthlyServicesView.vue'),
          meta: { pageKey: 'monthly-services' },
        },
        {
          path: 'monthly-invoices',
          name: 'monthly-invoices',
          component: () => import('@/views/MonthlyInvoicesView.vue'),
          meta: { pageKey: 'monthly-invoices' },
        },
        {
          path: 'electricity-invoices',
          name: 'electricity-invoices',
          component: () => import('@/views/MonthlyInvoicesView.vue'),
          meta: {
            pageKey: 'electricity-invoices',
            serviceTypeName: 1,
            pageTitle: 'فواتير الكهرباء',
            pageSubtitle: 'فواتير خدمة الكهرباء فقط — إضافة وتسديد وطباعة',
            addLabel: 'إضافة فاتورة كهرباء',
          },
        },
        {
          path: 'electricity-pricing',
          name: 'electricity-pricing',
          component: () => import('@/views/ServiceSettingsView.vue'),
          meta: {
            pageKey: 'electricity-pricing',
            serviceTypeName: 1,
            pageTitle: 'إعدادات تسعير الكهرباء',
            pageSubtitle: 'طريقة الحساب وسعر الواط وخدمة الكهرباء للمجمع',
            addLabel: 'إضافة تسعير كهرباء',
          },
        },
        {
          path: 'electricity-reports',
          name: 'electricity-reports',
          component: () => import('@/views/ElectricityReportsView.vue'),
          meta: {
            pageKey: 'electricity-reports',
            serviceTypeName: 1,
            pageTitle: 'تقارير الكهرباء',
            pageSubtitle: 'استهلاك ومبالغ وتحصيل فواتير الكهرباء',
          },
        },
        {
          path: 'gas-invoices',
          name: 'gas-invoices',
          component: () => import('@/views/MonthlyInvoicesView.vue'),
          meta: {
            pageKey: 'gas-invoices',
            serviceTypeName: 4,
            pageTitle: 'فواتير الغاز',
            pageSubtitle: 'فواتير خدمة الغاز فقط — إضافة وتسديد وطباعة',
            addLabel: 'إضافة فاتورة غاز',
          },
        },
        {
          path: 'gas-pricing',
          name: 'gas-pricing',
          component: () => import('@/views/ServiceSettingsView.vue'),
          meta: {
            pageKey: 'gas-pricing',
            serviceTypeName: 4,
            pageTitle: 'إعدادات تسعير الغاز',
            pageSubtitle: 'طريقة الحساب وسعر اللتر وخدمة الغاز للمجمع',
            addLabel: 'إضافة تسعير غاز',
          },
        },
        {
          path: 'gas-reports',
          name: 'gas-reports',
          component: () => import('@/views/ElectricityReportsView.vue'),
          meta: {
            pageKey: 'gas-reports',
            serviceTypeName: 4,
            pageTitle: 'تقارير الغاز',
            pageSubtitle: 'استهلاك ومبالغ وتحصيل فواتير الغاز',
          },
        },
        {
          path: 'water-invoices',
          name: 'water-invoices',
          component: () => import('@/views/MonthlyInvoicesView.vue'),
          meta: {
            pageKey: 'water-invoices',
            serviceTypeName: 2,
            pageTitle: 'فواتير المياه',
            pageSubtitle: 'فواتير خدمة المياه فقط — إضافة وتسديد وطباعة',
            addLabel: 'إضافة فاتورة مياه',
          },
        },
        {
          path: 'water-pricing',
          name: 'water-pricing',
          component: () => import('@/views/ServiceSettingsView.vue'),
          meta: {
            pageKey: 'water-pricing',
            serviceTypeName: 2,
            pageTitle: 'إعدادات تسعير المياه',
            pageSubtitle: 'طريقة الحساب وسعر المتر المكعب وخدمة المياه للمجمع',
            addLabel: 'إضافة تسعير مياه',
          },
        },
        {
          path: 'water-reports',
          name: 'water-reports',
          component: () => import('@/views/ElectricityReportsView.vue'),
          meta: {
            pageKey: 'water-reports',
            serviceTypeName: 2,
            pageTitle: 'تقارير المياه',
            pageSubtitle: 'استهلاك ومبالغ وتحصيل فواتير المياه',
          },
        },
        {
          path: 'expenses',
          name: 'expenses',
          component: () => import('@/views/ExpensesView.vue'),
          meta: { pageKey: 'expenses' },
        },
        {
          path: 'expenses-reports',
          name: 'expenses-reports',
          component: () => import('@/views/ExpensesReportsView.vue'),
          meta: { pageKey: 'expenses-reports' },
        },
        {
          path: 'general-reports',
          name: 'general-reports',
          component: () => import('@/views/GeneralReportsView.vue'),
          meta: { pageKey: 'general-reports' },
        },
        {
          path: 'audit-log',
          name: 'audit-log',
          component: () => import('@/views/AuditLogView.vue'),
          meta: { pageKey: 'audit-log' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { pageKey: 'settings' },
        },
        {
          path: 'notification-settings',
          name: 'notification-settings',
          component: () => import('@/views/NotificationSettingsView.vue'),
          meta: { pageKey: 'notification-settings' },
        },
        {
          path: 'reservations',
          name: 'reservations',
          component: () => import('@/views/ReservationsView.vue'),
          meta: { pageKey: 'reservations' },
        },
        {
          path: 'sales-contracts',
          name: 'sales-contracts',
          component: () => import('@/views/SalesContractsView.vue'),
          meta: { pageKey: 'sales-contracts' },
        },
        {
          path: 'price-plans',
          name: 'price-plans',
          component: () => import('@/views/PricePlansView.vue'),
          meta: { pageKey: 'price-plans' },
        },
        {
          path: 'contract-clauses',
          name: 'contract-clauses',
          component: () => import('@/views/ContractClausesView.vue'),
          meta: { pageKey: 'contract-clauses' },
        },
        {
          path: 'contract-designs',
          name: 'contract-designs',
          component: () => import('@/views/ContractDesignsView.vue'),
          meta: { pageKey: 'contract-designs' },
        },
        {
          path: 'installments',
          name: 'installments',
          component: () => import('@/views/InstallmentsView.vue'),
          meta: { pageKey: 'installments' },
        },
        {
          path: 'receipts',
          name: 'receipts',
          component: () => import('@/views/ReceiptsView.vue'),
          meta: { pageKey: 'receipts' },
        },
      ],
    },
]

const router = createRouter({
  history: createWebHistory(complexLocation.base),
  routes: complexLocation.slug ? appRoutes : notFoundRoutes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const residentOnly = to.matched.some((r) => r.meta.residentOnly)
  const staffOnly = to.matched.some((r) => r.meta.staffOnly)

  if (to.meta.public) {
    if (auth.isAuthenticated && (to.name === 'login' || to.name === 'resident-login')) {
      return auth.homePath || (auth.isResident ? '/resident-home' : '/')
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return {
      name: residentOnly ? 'resident-login' : 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (auth.isResident && !residentOnly) {
    return { name: 'resident-home' }
  }

  if (!auth.isResident && residentOnly) {
    return auth.homePath || '/'
  }

  if (staffOnly || (!residentOnly && !auth.isResident)) {
    const pageKey =
      (to.matched
        .map((r) => r.meta.pageKey as string | undefined)
        .filter(Boolean)
        .at(-1) as string | undefined) || pathToPageKey(to.path)

    if (pageKey && !auth.canAccessPage(pageKey)) {
      const fallback = auth.homePath || '/'
      if (fallback === to.path || fallback === to.fullPath) return true
      return fallback
    }
  }

  return true
})

router.onError((error, to) => {
  if (isStaleChunkError(error)) {
    reloadOnStaleChunk(to.fullPath)
  }
})

export default router

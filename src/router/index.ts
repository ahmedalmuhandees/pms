import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isStaleChunkError, reloadOnStaleChunk } from '@/utils/staleChunkReload'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/sales-contracts/:id/print',
      name: 'sales-contract-print',
      component: () => import('@/views/SalesContractPrintView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'complexes',
          name: 'complexes',
          component: () => import('@/views/ComplexesView.vue'),
        },
        {
          path: 'complex-builder',
          name: 'complex-builder',
          component: () => import('@/views/ComplexBuilderView.vue'),
          meta: { builderLayout: 'vertical' },
        },
        {
          path: 'horizontal-builder',
          name: 'horizontal-builder',
          component: () => import('@/views/ComplexBuilderView.vue'),
          meta: { builderLayout: 'horizontal' },
        },
        {
          path: 'complex-map',
          name: 'complex-map',
          component: () => import('@/views/ComplexMapView.vue'),
        },
        {
          path: 'blocks',
          name: 'blocks',
          component: () => import('@/views/BlocksView.vue'),
        },
        {
          path: 'buildings',
          name: 'buildings',
          component: () => import('@/views/BuildingsView.vue'),
        },
        {
          path: 'floors',
          name: 'floors',
          component: () => import('@/views/FloorsView.vue'),
        },
        {
          path: 'units',
          name: 'units',
          component: () => import('@/views/UnitsView.vue'),
        },
        {
          path: 'units/:id',
          name: 'unit-detail',
          component: () => import('@/views/UnitDetailView.vue'),
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/CustomersView.vue'),
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: () => import('@/views/CustomerDetailView.vue'),
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/views/EmployeesView.vue'),
        },
        {
          path: 'residents',
          name: 'residents',
          component: () => import('@/views/ResidentsView.vue'),
        },
        {
          path: 'technicians',
          name: 'technicians',
          component: () => import('@/views/TechniciansView.vue'),
        },
        {
          path: 'vehicles',
          name: 'vehicles',
          component: () => import('@/views/VehiclesView.vue'),
        },
        {
          path: 'visitors',
          name: 'visitors',
          component: () => import('@/views/VisitorsView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
        },
        {
          path: 'reservations',
          name: 'reservations',
          component: () => import('@/views/ReservationsView.vue'),
        },
        {
          path: 'sales-contracts',
          name: 'sales-contracts',
          component: () => import('@/views/SalesContractsView.vue'),
        },
        {
          path: 'price-plans',
          name: 'price-plans',
          component: () => import('@/views/PricePlansView.vue'),
        },
        {
          path: 'contract-clauses',
          name: 'contract-clauses',
          component: () => import('@/views/ContractClausesView.vue'),
        },
        {
          path: 'contract-designs',
          name: 'contract-designs',
          component: () => import('@/views/ContractDesignsView.vue'),
        },
        {
          path: 'installment-plans',
          name: 'installment-plans',
          component: () => import('@/views/InstallmentPlansView.vue'),
        },
        {
          path: 'installments',
          name: 'installments',
          component: () => import('@/views/InstallmentsView.vue'),
        },
        {
          path: 'payments',
          name: 'payments',
          component: () => import('@/views/PaymentsView.vue'),
        },
        {
          path: 'invoices',
          name: 'invoices',
          component: () => import('@/views/InvoicesView.vue'),
        },
        {
          path: 'invoice-details',
          name: 'invoice-details',
          component: () => import('@/views/InvoiceDetailsView.vue'),
        },
        {
          path: 'receipts',
          name: 'receipts',
          component: () => import('@/views/ReceiptsView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') return { name: 'dashboard' }
    return true
  }
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

router.onError((error, to) => {
  if (isStaleChunkError(error)) {
    reloadOnStaleChunk(to.fullPath)
  }
})

export default router

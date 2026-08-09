import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

export default router

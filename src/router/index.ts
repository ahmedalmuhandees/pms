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

import { computed, ref, type Ref } from 'vue'
import type { PagedResult, PaginationParams } from '@/types'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/auth'
import {
  nextTableSortMode,
  paramsToTableSort,
  tableSortModeLabel,
  tableSortOrder,
  tableSortToParams,
  type TableSortMode,
} from '@/utils/tableSort'

export function usePagedList<T, P extends PaginationParams = PaginationParams>(
  fetcher: (params?: P) => Promise<PagedResult<T>>,
  initialFilters: Partial<P> = {},
) {
  const auth = useAuthStore()
  const notify = useNotify()
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(true)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const search = ref('')

  const defaultSort = tableSortToParams('latest')
  const scoped = auth.scopedComplexId
  const seededFilters = {
    SortBy: defaultSort.SortBy,
    SortDirection: defaultSort.SortDirection,
    ...initialFilters,
    ...(scoped ? ({ ComplexId: scoped } as unknown as Partial<P>) : {}),
  }
  const filters = ref({ ...seededFilters }) as Ref<Partial<P>>
  const sortMode = ref<TableSortMode>(
    paramsToTableSort(
      (seededFilters as PaginationParams).SortBy,
      (seededFilters as PaginationParams).SortDirection,
    ),
  )

  /** حقل وهمي لأيقونة الفرز في رؤوس الأعمدة */
  const sortField = ref('createdAt')
  const sortOrder = computed(() => tableSortOrder(sortMode.value))
  const sortModeLabel = computed(() => tableSortModeLabel(sortMode.value))

  async function load() {
    loading.value = true
    try {
      const complexId = auth.scopedComplexId
      const params = {
        ...filters.value,
        ...(complexId ? { ComplexId: complexId } : {}),
        Page: page.value,
        PageSize: pageSize.value,
        Search: search.value || undefined,
      } as P
      const result = await fetcher(params)
      items.value = result.items ?? []
      total.value = result.totalCount
      page.value = result.page
      pageSize.value = result.pageSize
    } catch (error) {
      notify.error(getErrorMessage(error))
      items.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function onPageChange(p: number) {
    page.value = p
    void load()
  }

  function onSizeChange(size: number) {
    pageSize.value = size
    page.value = 1
    void load()
  }

  function onSearch() {
    page.value = 1
    void load()
  }

  function setFilter<K extends keyof P>(key: K, value: P[K] | undefined) {
    if (String(key) === 'ComplexId' && auth.scopedComplexId) {
      filters.value = { ...filters.value, [key]: auth.scopedComplexId as P[K] }
      page.value = 1
      void load()
      return
    }
    if (value === undefined || value === null || value === '') {
      const next = { ...filters.value }
      delete next[key]
      filters.value = next
    } else {
      filters.value = { ...filters.value, [key]: value }
    }
    page.value = 1
    void load()
  }

  function setSortMode(mode: TableSortMode) {
    sortMode.value = mode
    const p = tableSortToParams(mode)
    filters.value = {
      ...filters.value,
      SortBy: p.SortBy,
      SortDirection: p.SortDirection,
    } as Partial<P>
    page.value = 1
    void load()
  }

  /** نقر رأس عمود في الجدول → تبديل بين آخر إضافة / تسلسلي / عكسي */
  function onTableSort() {
    setSortMode(nextTableSortMode(sortMode.value))
  }

  function onLazyPage(event: { page: number; rows: number }) {
    page.value = event.page + 1
    pageSize.value = event.rows
    void load()
  }

  return {
    items,
    loading,
    page,
    pageSize,
    total,
    search,
    filters,
    sortMode,
    sortField,
    sortOrder,
    sortModeLabel,
    load,
    onPageChange,
    onSizeChange,
    onSearch,
    setFilter,
    setSortMode,
    onTableSort,
    onLazyPage,
  }
}

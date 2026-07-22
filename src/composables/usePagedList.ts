import { ref, type Ref } from 'vue'
import type { PagedResult, PaginationParams } from '@/types'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'

export function usePagedList<T, P extends PaginationParams = PaginationParams>(
  fetcher: (params?: P) => Promise<PagedResult<T>>,
  initialFilters: Partial<P> = {},
) {
  const notify = useNotify()
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(true)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const search = ref('')
  const filters = ref({ ...initialFilters }) as Ref<Partial<P>>

  async function load() {
    loading.value = true
    try {
      const params = {
        ...filters.value,
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
    load,
    onPageChange,
    onSizeChange,
    onSearch,
    setFilter,
    onLazyPage,
  }
}

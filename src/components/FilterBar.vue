<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import TableSortSelect from '@/components/TableSortSelect.vue'
import type { TableSortMode } from '@/utils/tableSort'

const search = defineModel<string>('search', { default: '' })
const sortMode = defineModel<TableSortMode>('sortMode', { default: 'latest' })

const props = defineProps<{
  placeholder?: string
  showSearchButton?: boolean
  /** القائمة المنسدلة — افتراضي مخفية؛ الفرز يتم بنقر رأس العمود */
  showSort?: boolean
}>()

const emit = defineEmits<{
  search: []
  sortChange: [TableSortMode]
}>()

const showSortControl = computed(() => props.showSort === true)

function onSortChange(mode: TableSortMode) {
  sortMode.value = mode
  emit('sortChange', mode)
}

function submit() {
  emit('search')
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar__main">
      <div class="search-field">
        <i class="pi pi-search search-field__icon" />
        <InputText
          v-model="search"
          :placeholder="placeholder || 'ابحث هنا...'"
          @keyup.enter="submit"
        />
      </div>
      <div v-if="showSortControl" class="filter-bar__sort">
        <span class="filter-bar__sort-label">الترتيب</span>
        <TableSortSelect
          :model-value="sortMode"
          @update:model-value="onSortChange"
        />
      </div>
      <div v-if="$slots.filters" class="filter-bar__filters">
        <slot name="filters" />
      </div>
    </div>
    <div class="filter-bar__actions">
      <Button
        v-if="showSearchButton !== false"
        label="بحث"
        icon="pi pi-search"
        severity="secondary"
        outlined
        @click="submit"
      />
      <slot name="extra" />
    </div>
  </div>
</template>

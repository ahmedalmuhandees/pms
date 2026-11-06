<script setup lang="ts">
import Select from 'primevue/select'
import { TABLE_SORT_OPTIONS, type TableSortMode } from '@/utils/tableSort'

const model = defineModel<TableSortMode>({ default: 'latest' })
</script>

<template>
  <Select
    v-model="model"
    :options="TABLE_SORT_OPTIONS"
    option-label="label"
    option-value="value"
    placeholder="الترتيب"
    class="table-sort-select"
    append-to="body"
  />
</template>

<style scoped>
.table-sort-select {
  min-width: 12rem;
  width: 12rem;
}
</style>

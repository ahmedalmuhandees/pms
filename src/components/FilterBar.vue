<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const search = defineModel<string>('search', { default: '' })

defineProps<{
  placeholder?: string
  showSearchButton?: boolean
}>()

const emit = defineEmits<{
  search: []
}>()

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

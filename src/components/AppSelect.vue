<script setup lang="ts">
import Select from 'primevue/select'

withDefaults(
  defineProps<{
    options: unknown[]
    optionLabel?: string
    optionValue?: string
    placeholder?: string
    showClear?: boolean
    filter?: boolean
    checkmark?: boolean
    disabled?: boolean
  }>(),
  {
    placeholder: 'اختر...',
    showClear: false,
    filter: false,
    checkmark: true,
    disabled: false,
  },
)

const model = defineModel<unknown>()
</script>

<template>
  <Select
    v-model="model"
    class="app-select"
    :options="options"
    :option-label="optionLabel"
    :option-value="optionValue"
    :placeholder="placeholder"
    :show-clear="showClear"
    :filter="filter"
    :checkmark="checkmark"
    :disabled="disabled"
    append-to="body"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </Select>
</template>

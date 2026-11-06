<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import { loadFieldMemory, rememberFieldValue } from '@/composables/useFieldMemory'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    memoryKey: string
    placeholder?: string
    type?: string
    disabled?: boolean
    class?: string
  }>(),
  {
    modelValue: '',
    placeholder: '',
    type: 'text',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const listId = computed(() => `field-memory-${props.memoryKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`)
const suggestions = ref<string[]>([])

function refresh() {
  suggestions.value = loadFieldMemory(props.memoryKey)
}

watch(
  () => props.memoryKey,
  () => refresh(),
  { immediate: true },
)

function onUpdate(value: string | undefined) {
  emit('update:modelValue', value ?? '')
}

function onBlur() {
  rememberFieldValue(props.memoryKey, props.modelValue)
  refresh()
}
</script>

<template>
  <InputText
    :model-value="modelValue ?? ''"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :list="listId"
    :class="props.class"
    autocomplete="on"
    @update:model-value="onUpdate"
    @blur="onBlur"
  />
  <datalist :id="listId">
    <option v-for="item in suggestions" :key="item" :value="item" />
  </datalist>
</template>

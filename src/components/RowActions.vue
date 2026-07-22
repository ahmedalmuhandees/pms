<script setup lang="ts">
defineProps<{
  showDetails?: boolean
}>()

defineEmits<{
  edit: []
  remove: []
  details: []
}>()
</script>

<template>
  <div class="row-actions">
    <button
      v-if="showDetails"
      type="button"
      class="action-btn is-view"
      v-tooltip.top="'التفاصيل'"
      aria-label="التفاصيل"
      @click="$emit('details')"
    >
      <i class="pi pi-eye" />
    </button>
    <button
      type="button"
      class="action-btn is-edit"
      v-tooltip.top="'تعديل'"
      aria-label="تعديل"
      @click="$emit('edit')"
    >
      <i class="pi pi-file-edit" />
    </button>
    <button
      type="button"
      class="action-btn is-delete"
      v-tooltip.top="'حذف'"
      aria-label="حذف"
      @click="$emit('remove')"
    >
      <i class="pi pi-trash" />
    </button>
  </div>
</template>

<style scoped>
.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 11px;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  font-size: 0.95rem;
  background: transparent;
  color: var(--muted);
  transition:
    background 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.action-btn i {
  line-height: 1;
}

.action-btn.is-view:hover {
  color: #2b6cb0;
  background: rgba(43, 108, 176, 0.1);
  box-shadow: inset 0 0 0 1px rgba(43, 108, 176, 0.14);
}

.action-btn.is-edit:hover {
  color: #156574;
  background: rgba(21, 101, 116, 0.1);
  box-shadow: inset 0 0 0 1px rgba(21, 101, 116, 0.14);
}

.action-btn.is-delete:hover {
  color: #c0392b;
  background: rgba(192, 57, 43, 0.1);
  box-shadow: inset 0 0 0 1px rgba(192, 57, 43, 0.14);
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn:active {
  transform: scale(0.96);
}

.action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(21, 101, 116, 0.2);
}
</style>

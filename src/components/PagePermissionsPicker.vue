<script setup lang="ts">
import { computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import {
  filterGroupsByAllowed,
  type PageKey,
  type PagePermissionGroup,
} from '@/utils/pagePermissions'

const roleName = defineModel<string | null>('roleName', { default: '' })
const pageKeys = defineModel<string[] | null>('pageKeys', { default: () => [] })

const props = withDefaults(
  defineProps<{
    /** إن وُجدت: يقتصر الاختيار على هذه الصفحات (مدير → موظف) */
    allowedKeys?: string[] | null
    /** عرض كل الصفحات عند فراغ allowedKeys (أدمن) */
    showAllWhenEmpty?: boolean
    roleNameLabel?: string
    pagesLabel?: string
  }>(),
  {
    showAllWhenEmpty: true,
    roleNameLabel: 'اسم الصلاحية',
    pagesLabel: 'صفحات السايدبار المسموحة',
  },
)

const groups = computed<PagePermissionGroup[]>(() =>
  filterGroupsByAllowed(props.allowedKeys, { allIfEmpty: props.showAllWhenEmpty }),
)

const selectedSet = computed(() => new Set(pageKeys.value || []))

function isChecked(key: string) {
  return selectedSet.value.has(key)
}

function toggle(key: string, checked: boolean) {
  const next = new Set(pageKeys.value || [])
  if (checked) next.add(key)
  else next.delete(key)
  pageKeys.value = Array.from(next)
}

function toggleGroup(group: PagePermissionGroup, checked: boolean) {
  const next = new Set(pageKeys.value || [])
  for (const item of group.items) {
    if (checked) next.add(item.key)
    else next.delete(item.key)
  }
  pageKeys.value = Array.from(next)
}

function groupChecked(group: PagePermissionGroup) {
  return group.items.length > 0 && group.items.every((i) => selectedSet.value.has(i.key))
}

function groupPartial(group: PagePermissionGroup) {
  const n = group.items.filter((i) => selectedSet.value.has(i.key)).length
  return n > 0 && n < group.items.length
}

function selectAll() {
  pageKeys.value = groups.value.flatMap((g) => g.items.map((i) => i.key as PageKey))
}

function clearAll() {
  pageKeys.value = []
}
</script>

<template>
  <div class="perm-picker">
    <div class="field">
      <label>{{ roleNameLabel }}</label>
      <InputText
        :model-value="roleName ?? ''"
        class="w-full"
        placeholder="مثال: مدير مبيعات"
        @update:model-value="roleName = $event ?? ''"
      />
    </div>

    <div class="pages-head">
      <strong>{{ pagesLabel }}</strong>
      <div class="pages-actions">
        <button type="button" class="link-btn" @click="selectAll">تحديد الكل</button>
        <button type="button" class="link-btn" @click="clearAll">إلغاء الكل</button>
      </div>
    </div>

    <div v-if="!groups.length" class="empty-hint">لا توجد صفحات متاحة للاختيار</div>

    <div v-for="group in groups" :key="group.key" class="perm-group">
      <div class="group-title">
        <Checkbox
          :model-value="groupChecked(group)"
          :indeterminate="groupPartial(group)"
          binary
          :input-id="`grp-${group.key}`"
          @update:model-value="(v: boolean) => toggleGroup(group, v)"
        />
        <label :for="`grp-${group.key}`">{{ group.label }}</label>
      </div>
      <div class="group-items">
        <label v-for="item in group.items" :key="item.key" class="page-item">
          <Checkbox
            :model-value="isChecked(item.key)"
            binary
            :input-id="`page-${item.key}`"
            @update:model-value="(v: boolean) => toggle(item.key, v)"
          />
          <span>{{ item.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perm-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}
.w-full {
  width: 100%;
}
.pages-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pages-actions {
  display: flex;
  gap: 10px;
}
.link-btn {
  border: 0;
  background: transparent;
  color: var(--brand-mid, #1e3a8a);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0;
}
.perm-group {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--surface, #fff);
}
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  margin-bottom: 8px;
}
.group-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 6px 10px;
  padding-inline-start: 4px;
}
.page-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  cursor: pointer;
}
.empty-hint {
  color: var(--muted, #6b7280);
  font-size: 0.88rem;
}
</style>

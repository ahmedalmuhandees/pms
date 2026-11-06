<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import RememberedInput from '@/components/RememberedInput.vue'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Block, Complex, CreateBlockDto } from '@/types'
import { createBlock, deleteBlock, getBlocks, updateBlock, type BlockParams } from '@/api/blocks'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions } from '@/utils/enums'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const auth = useAuthStore()
const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const complexMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<Block, BlockParams>(getBlocks)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const form = reactive<CreateBlockDto>({ name: '', description: '', complexId: '' })

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    description: '',
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Block) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, description: row.description, complexId: row.complexId })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateBlock(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createBlock({ ...form })
      notify.success('تم الإنشاء')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Block) {
  if (!(await ask(`حذف البلوك "${row.name}"؟`))) return
  try {
    await deleteBlock(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadComplexes()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="البلوكات" subtitle="تنظيم البلوكات داخل المجمعات السكنية">
      <template v-if="auth.isSuperAdmin" #actions>
        <Button label="إضافة بلوك" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث عن بلوك بالاسم أو الوصف..." @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode">
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="فلتر بالمجمع"
            show-clear
            style="min-width: 200px"
            @update:model-value="(v: string | null) => setFilter('ComplexId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="4" />
      <template v-else>
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
        :value="items"
        :loading="loading"
        lazy
        paginator
        :rows="pageSize"
        :total-records="total"
        :first="(page - 1) * pageSize"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        size="small"
        @page="onLazyPage"
      
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          @sort="onTableSort">
        <Column field="name" header="الاسم"  sortable />
        <Column field="description" header="الوصف"  sortable />
        <Column header="المجمع" sortable>
          <template #body="{ data }">{{ complexMap[data.complexId] || data.complexId }}</template>
        </Column>
        <Column header="إجراءات" style="width: 130px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل بلوك' : 'إضافة بلوك'"
      :style="{ width: '480px' }"
    >
      <div class="form-grid" style="grid-template-columns: 1fr">
        <div class="field">
          <label>المجمع</label>
          <Select
            :disabled="!auth.canSelectComplex"
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المجمع"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الاسم</label>
          <RememberedInput v-model="form.name" memory-key="block.name" />
        </div>
        <div class="field">
          <label>الوصف</label>
          <Textarea v-model="form.description" rows="3" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

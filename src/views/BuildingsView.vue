<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Block, Building, CreateBuildingDto } from '@/types'
import {
  createBuilding, deleteBuilding, getBuildings, updateBuilding, type BuildingParams,
} from '@/api/buildings'
import { getBlocks } from '@/api/blocks'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const blocks = ref<Block[]>([])
const blockMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Building, BuildingParams>(getBuildings)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const blockFilter = ref<string | null>(null)
const form = reactive<CreateBuildingDto>({ name: '', description: '', blockId: '' })

const blockOptions = computed(() =>
  asSelectOptions(blocks.value, (b) => b.name || b.id),
)

async function loadBlocks() {
  const result = await getBlocks({ Page: 1, PageSize: 200 })
  blocks.value = result.items ?? []
  blockMap.value = Object.fromEntries(blocks.value.map((b) => [b.id, b.name || b.id]))
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    description: '',
    blockId: blockFilter.value || blocks.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Building) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, description: row.description, blockId: row.blockId })
  dialogVisible.value = true
}

async function save() {
  if (!form.blockId) {
    notify.warning('اختر البلوك')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateBuilding(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createBuilding({ ...form })
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

async function remove(row: Building) {
  if (!(await ask(`حذف المبنى "${row.name}"؟`))) return
  try {
    await deleteBuilding(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadBlocks()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="المباني" subtitle="إدارة المباني المرتبطة بالبلوكات">
      <template #actions>
        <Button label="إضافة مبنى" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث عن مبنى..." @search="onSearch">
        <template #filters>
          <Select
            v-model="blockFilter"
            :options="blockOptions"
            option-label="label"
            option-value="id"
            placeholder="فلتر بالبلوك"
            show-clear
            style="min-width: 200px"
            @update:model-value="(v: string | null) => setFilter('BlockId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="4" />
      <DataTable
        v-else
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
      >
        <Column field="name" header="الاسم" />
        <Column field="description" header="الوصف" />
        <Column header="البلوك">
          <template #body="{ data }">{{ blockMap[data.blockId] || data.blockId }}</template>
        </Column>
        <Column header="إجراءات" style="width: 130px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات</div></template>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل مبنى' : 'إضافة مبنى'"
      :style="{ width: '480px' }"
    >
      <div class="form-grid" style="grid-template-columns: 1fr">
        <div class="field">
          <label>البلوك</label>
          <Select
            v-model="form.blockId"
            :options="blockOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر البلوك"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الاسم</label>
          <InputText v-model="form.name" />
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

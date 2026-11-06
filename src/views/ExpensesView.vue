<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex } from '@/types'
import {
  createExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  updateExpense,
  type Expense,
  type ExpenseCategory,
  type ExpenseParams,
} from '@/api/expenses'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate, formatMoney } from '@/utils/enums'
import { resolveMediaUrl } from '@/utils/media'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const notify = useNotify()
const { ask } = useConfirmAction()

const complexes = ref<Complex[]>([])
const categories = ref<ExpenseCategory[]>([])
const categorySuggestions = ref<ExpenseCategory[]>([])
const complexFilter = ref<string | null>(auth.scopedComplexId)
const categoryFilter = ref<string | null>(null)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<Expense, ExpenseParams>(getExpenses)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const expenseDateModel = ref<Date | null>(new Date())
const categoryModel = ref<ExpenseCategory | string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

const form = reactive({
  complexId: '' as string,
  categoryName: '',
  categoryId: null as string | null,
  amount: 0,
  payee: '',
  documentNumber: '',
  notes: '',
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const categoryFilterOptions = computed(() =>
  categories.value.map((c) => ({ label: c.name, value: c.id })),
)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
}

async function loadCategories(complexId?: string | null) {
  if (!complexId) {
    categories.value = []
    return
  }
  categories.value = await getExpenseCategories({ complexId })
}

async function searchCategories(event: { query: string }) {
  const complexId = form.complexId || complexFilter.value
  if (!complexId) {
    categorySuggestions.value = []
    return
  }
  categorySuggestions.value = await getExpenseCategories({
    complexId,
    search: event.query || undefined,
  })
}

function openCreate() {
  editingId.value = null
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  expenseDateModel.value = new Date()
  categoryModel.value = null
  Object.assign(form, {
    complexId: complexFilter.value || auth.scopedComplexId || complexes.value[0]?.id || '',
    categoryName: '',
    categoryId: null,
    amount: 0,
    payee: '',
    documentNumber: '',
    notes: '',
  })
  void loadCategories(form.complexId)
  dialogVisible.value = true
}

function openEdit(row: Expense) {
  editingId.value = row.id
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  expenseDateModel.value = row.expenseDate ? new Date(row.expenseDate) : new Date()
  categoryModel.value = { id: row.categoryId, name: row.categoryName, complexId: row.complexId }
  Object.assign(form, {
    complexId: row.complexId,
    categoryName: row.categoryName,
    categoryId: row.categoryId,
    amount: Number(row.amount),
    payee: row.payee,
    documentNumber: row.documentNumber || '',
    notes: row.notes || '',
  })
  void loadCategories(row.complexId)
  dialogVisible.value = true
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function resolveCategoryPayload() {
  if (typeof categoryModel.value === 'string') {
    return { categoryName: categoryModel.value.trim(), categoryId: null as string | null }
  }
  if (categoryModel.value && typeof categoryModel.value === 'object') {
    return {
      categoryName: categoryModel.value.name,
      categoryId: categoryModel.value.id,
    }
  }
  return { categoryName: form.categoryName.trim(), categoryId: form.categoryId }
}

async function save() {
  const { categoryName, categoryId } = resolveCategoryPayload()
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  if (!categoryName) {
    notify.warning('أدخل اسم المصروف')
    return
  }
  if (!form.amount || form.amount <= 0) {
    notify.warning('أدخل مبلغاً صالحاً')
    return
  }
  if (!form.payee.trim()) {
    notify.warning('أدخل جهة الصرف')
    return
  }

  const payload = {
    categoryName,
    categoryId,
    amount: Number(form.amount),
    payee: form.payee.trim(),
    documentNumber: form.documentNumber.trim() || null,
    expenseDate: expenseDateModel.value ? expenseDateModel.value.toISOString() : null,
    notes: form.notes.trim() || null,
    complexId: form.complexId,
    file: selectedFile.value,
  }

  saving.value = true
  try {
    if (editingId.value) {
      await updateExpense(editingId.value, payload)
      notify.success('تم تحديث المصروف')
    } else {
      await createExpense(payload)
      notify.success('تم إضافة المصروف')
    }
    dialogVisible.value = false
    await loadCategories(form.complexId)
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Expense) {
  const ok = await ask('هل تريد حذف هذا المصروف؟', 'حذف مصروف')
  if (!ok) return
  try {
    await deleteExpense(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

watch(complexFilter, async (id) => {
  setFilter('ComplexId', id || undefined)
  categoryFilter.value = null
  setFilter('CategoryId', undefined)
  await loadCategories(id)
  await load()
})

watch(categoryFilter, (id) => {
  setFilter('CategoryId', id || undefined)
  void load()
})

watch(
  () => form.complexId,
  (id) => {
    void loadCategories(id)
  },
)

onMounted(async () => {
  try {
    await loadComplexes()
    if (!complexFilter.value) {
      complexFilter.value = auth.scopedComplexId || complexes.value[0]?.id || null
    }
    if (complexFilter.value) setFilter('ComplexId', complexFilter.value)
    await loadCategories(complexFilter.value)
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="إضافة المصاريف" subtitle="تسجيل المصاريف مع الفئات الذكية والمرفقات">
      <template #actions>
        <Button label="إضافة مصروف" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="بحث بالجهة أو رقم المستند أو الاسم..." @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode">
        <Select
          v-if="auth.canSelectComplex"
          v-model="complexFilter"
          :options="complexOptions"
          option-label="label"
          option-value="id"
          placeholder="المجمع"
          show-clear
          append-to="body"
        />
        <Select
          v-model="categoryFilter"
          :options="categoryFilterOptions"
          option-label="label"
          option-value="value"
          placeholder="اسم المصروف"
          show-clear
          filter
          append-to="body"
        />
      </FilterBar>

      <TableSkeleton v-if="loading && !items.length" />
      <template v-else>
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
        :value="items"
        :lazy="true"
        :paginator="true"
        :rows="pageSize"
        :total-records="total"
        :first="(page - 1) * pageSize"
        data-key="id"
        striped-rows
        @page="onLazyPage"
      
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          @sort="onTableSort">
        <Column header="رقم المستند" style="width: 120px" sortable>
          <template #body="{ data }">{{ data.documentNumber || '—' }}</template>
        </Column>
        <Column header="اسم المصروف" sortable>
          <template #body="{ data }">{{ data.categoryName }}</template>
        </Column>
        <Column header="المبلغ" style="width: 120px" sortable>
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="جهة الصرف" sortable>
          <template #body="{ data }">{{ data.payee }}</template>
        </Column>
        <Column header="تاريخ الصرف" style="width: 120px" sortable>
          <template #body="{ data }">{{ formatDate(data.expenseDate) }}</template>
        </Column>
        <Column header="المرفق" style="width: 110px" sortable>
          <template #body="{ data }">
            <a
              v-if="data.attachmentPath"
              :href="resolveMediaUrl(data.attachmentPath)"
              target="_blank"
              rel="noopener"
              class="link"
            >معاينة</a>
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="ملاحظات" sortable>
          <template #body="{ data }">{{ data.notes || '—' }}</template>
        </Column>
        <Column header="" style="width: 100px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @delete="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد مصاريف</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل مصروف' : 'إضافة مصروف'"
      :style="{ width: '560px' }"
    >
      <div class="form-grid single">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>اسم المصروف</label>
          <AutoComplete
            v-model="categoryModel"
            :suggestions="categorySuggestions"
            option-label="name"
            dropdown
            :force-selection="false"
            placeholder="اكتب أو اختر من القائمة"
            class="w-full"
            @complete="searchCategories"
          >
            <template #option="{ option }">{{ option.name }}</template>
          </AutoComplete>
          <small class="field-hint">إن كان الاسم جديداً يُحفظ تلقائياً للقوائم القادمة</small>
        </div>
        <div class="field">
          <label>المبلغ</label>
          <InputNumber v-model="form.amount" :min="0" :min-fraction-digits="0" :max-fraction-digits="2" />
        </div>
        <div class="field">
          <label>جهة الصرف</label>
          <InputText v-model="form.payee" placeholder="المورد / المقاول / الشركة" />
        </div>
        <div class="field">
          <label>رقم المستند / الفاتورة</label>
          <InputText v-model="form.documentNumber" />
        </div>
        <div class="field">
          <label>رفع صورة الفاتورة / المستند</label>
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            class="file-input"
            @change="onFileSelected"
          />
          <small v-if="selectedFile">{{ selectedFile.name }}</small>
        </div>
        <div class="field">
          <label>تاريخ الصرف</label>
          <DatePicker
            v-model="expenseDateModel"
            date-format="yy-mm-dd"
            show-icon
            append-to="body"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>ملاحظات</label>
          <Textarea v-model="form.notes" rows="3" auto-resize />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.link {
  color: #156574;
  font-weight: 700;
  text-decoration: none;
}
.field-hint {
  display: block;
  margin-top: 0.35rem;
  color: var(--muted);
  font-size: 0.78rem;
}
.file-input {
  width: 100%;
  font-size: 0.9rem;
}
</style>

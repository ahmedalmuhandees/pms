<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Paginator from 'primevue/paginator'
import type { Complex, CreateComplexDto } from '@/types'
import {
  createComplex,
  deleteComplex,
  getComplexes,
  updateComplex,
} from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { formatDate, complexStatusOptions, labelOf } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import CardGridSkeleton from '@/components/skeletons/CardGridSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()

const {
  items,
  loading,
  page,
  pageSize,
  total,
  search,
  load,
  onSearch,
  onLazyPage,
} = usePagedList(getComplexes)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const openingDateModel = ref<Date | null>(null)

const form = reactive<CreateComplexDto>({
  name: '',
  nameAr: '',
  address: '',
  city: '',
  latitude: null,
  longitude: null,
  developer: '',
  openingDate: null,
  status: 'Active',
})

function resetForm() {
  editingId.value = null
  openingDateModel.value = null
  Object.assign(form, {
    name: '',
    nameAr: '',
    address: '',
    city: '',
    latitude: null,
    longitude: null,
    developer: '',
    openingDate: null,
    status: 'Active',
  })
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: Complex) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    nameAr: row.nameAr,
    address: row.address,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    developer: row.developer,
    openingDate: row.openingDate,
    status: row.status,
  })
  openingDateModel.value = row.openingDate ? new Date(row.openingDate) : null
  dialogVisible.value = true
}

async function save() {
  form.openingDate = openingDateModel.value ? openingDateModel.value.toISOString() : null
  saving.value = true
  try {
    if (editingId.value) {
      await updateComplex(editingId.value, { ...form })
      notify.success('تم تحديث المجمع')
    } else {
      await createComplex({ ...form })
      notify.success('تم إنشاء المجمع')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Complex) {
  if (!(await ask(`حذف المجمع "${row.nameAr || row.name}"؟`))) return
  try {
    await deleteComplex(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function statusClass(status: string | null) {
  if (status === 'Active') return 'is-active'
  if (status === 'UnderConstruction') return 'is-building'
  return 'is-inactive'
}

onMounted(() => {
  pageSize.value = 12
  void load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="المجمعات السكنية" subtitle="استعرض المجمعات وأدرها من خلال بطاقات تفاعلية">
      <template #actions>
        <Button label="إضافة مجمع" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <FilterBar
      v-model:search="search"
      placeholder="ابحث عن مجمع بالاسم أو المدينة أو المطور..."
      @search="onSearch"
    />

    <CardGridSkeleton v-if="loading && items.length === 0" :cards="12" />

    <div v-else class="complex-grid">
      <article
        v-for="(item, index) in items"
        :key="item.id"
        class="complex-card"
        :style="{ animationDelay: `${0.04 * index}s` }"
      >
        <div class="card-top">
          <div class="card-icon">
            <i class="pi pi-building" style="font-size: 1.25rem" />
          </div>
          <span class="status-pill" :class="statusClass(item.status)">
            {{ labelOf(complexStatusOptions, item.status) }}
          </span>
        </div>

        <h3 class="card-title">{{ item.nameAr || item.name || 'بدون اسم' }}</h3>
        <p v-if="item.nameAr && item.name" class="card-subtitle">{{ item.name }}</p>

        <div class="card-meta">
          <div class="meta-row">
            <i class="pi pi-map-marker" />
            <span>{{ [item.city, item.address].filter(Boolean).join(' — ') || 'لا يوجد عنوان' }}</span>
          </div>
          <div class="meta-row">
            <i class="pi pi-building" />
            <span>{{ item.developer || 'المطور غير محدد' }}</span>
          </div>
          <div class="meta-row">
            <i class="pi pi-calendar" />
            <span>الافتتاح: {{ formatDate(item.openingDate) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button type="button" class="action-btn is-edit card-action-wide" @click="openEdit(item)">
            <i class="pi pi-file-edit" />
            <span>تعديل</span>
          </button>
          <button type="button" class="action-btn is-delete card-action-wide" @click="remove(item)">
            <i class="pi pi-trash" />
            <span>حذف</span>
          </button>
        </div>
      </article>

      <div v-if="items.length === 0" class="empty-state">
        <i class="pi pi-inbox empty-icon" />
        <p>لا توجد مجمعات بعد</p>
        <Button label="إضافة أول مجمع" icon="pi pi-plus" @click="openCreate" />
      </div>
    </div>

    <div v-if="total > 0" class="pagination-wrap page-card">
      <Paginator
        :rows="pageSize"
        :total-records="total"
        :first="(page - 1) * pageSize"
        :rows-per-page-options="[8, 12, 24]"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
        current-page-report-template="{first} إلى {last} من {totalRecords}"
        @page="onLazyPage"
      />
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل مجمع' : 'إضافة مجمع'"
      :style="{ width: '560px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>الاسم بالعربي</label>
          <InputText v-model="form.nameAr" />
        </div>
        <div class="field">
          <label>الاسم بالإنجليزي</label>
          <InputText v-model="form.name" />
        </div>
        <div class="field">
          <label>المدينة</label>
          <InputText v-model="form.city" />
        </div>
        <div class="field">
          <label>المطور</label>
          <InputText v-model="form.developer" />
        </div>
        <div class="field full">
          <label>العنوان</label>
          <InputText v-model="form.address" />
        </div>
        <div class="field">
          <label>خط العرض</label>
          <InputNumber v-model="form.latitude" :min-fraction-digits="0" :max-fraction-digits="8" />
        </div>
        <div class="field">
          <label>خط الطول</label>
          <InputNumber v-model="form.longitude" :min-fraction-digits="0" :max-fraction-digits="8" />
        </div>
        <div class="field">
          <label>تاريخ الافتتاح</label>
          <DatePicker v-model="openingDateModel" date-format="yy/mm/dd" show-icon />
        </div>
        <div class="field">
          <label>الحالة</label>
          <Select
            v-model="form.status"
            :options="complexStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
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

<style scoped>
.complex-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  min-height: 160px;
}

.complex-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.28s var(--ease),
    box-shadow 0.28s var(--ease),
    border-color 0.28s var(--ease);
  animation: cardRise 0.55s var(--ease-out) both;
}

.complex-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: color-mix(in srgb, var(--brand-mid) 30%, var(--border));
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--brand-mid);
  background: linear-gradient(145deg, var(--brand-soft), #fff);
  border: 1px solid color-mix(in srgb, var(--brand-mid) 16%, transparent);
}

.status-pill {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.status-pill.is-active {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 12%, white);
}

.status-pill.is-building {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 12%, white);
}

.status-pill.is-inactive {
  color: var(--muted);
  background: var(--surface-2);
}

.card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-strong);
  line-height: 1.35;
}

.card-subtitle {
  margin: -4px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  flex: 1;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.meta-row i {
  margin-top: 2px;
  color: var(--brand-mid);
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 40px 16px;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--muted);
}

.empty-icon {
  font-size: 2rem;
  color: var(--brand-mid);
}

.pagination-wrap {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
</style>

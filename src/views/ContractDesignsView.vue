<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ColorPicker from 'primevue/colorpicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, ContractDesign, CreateContractDesignDto } from '@/types'
import {
  createContractDesign,
  deleteContractDesign,
  getContractDesigns,
  updateContractDesign,
  type ContractDesignParams,
} from '@/api/contractDesigns'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  contractFontOptions,
  logoPositionOptions,
} from '@/utils/enums'
import { DEFAULT_CONTRACT_LOGO } from '@/utils/contractPrintTheme'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const complexMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<ContractDesign, ContractDesignParams>(getContractDesigns)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const signaturesText = ref('توقيع المطور\nتوقيع المشتري\nالختم')
const primaryColorHex = ref('1e3a8a')

function emptyForm(): CreateContractDesignDto {
  return {
    complexId: '',
    complexName: '',
    header: {
      logoUrl: DEFAULT_CONTRACT_LOGO,
      logoPosition: 'center',
      title: 'عقد بيع ابتدائي',
      subtitle: '(مع احتفاظ البائع بالملكية لحين سداد باقي الثمن)',
    },
    body: {
      terms: '',
      showPaymentTable: true,
    },
    footer: {
      footerText: 'جميع الحقوق محفوظة',
      signatures: ['الطرف الثاني (المشتري)', 'الطرف الاول (البائع)'],
    },
    style: {
      primaryColor: '#2f5139',
      fontFamily: 'Cairo',
    },
  }
}

const form = reactive<CreateContractDesignDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

async function loadLookups() {
  const complexResult = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = complexResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
}

function syncComplexName() {
  const complex = complexes.value.find((c) => c.id === form.complexId)
  form.complexName = complex?.nameAr || complex?.name || ''
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  form.complexId = complexFilter.value || complexes.value[0]?.id || ''
  syncComplexName()
  signaturesText.value = (form.footer?.signatures || []).join('\n')
  primaryColorHex.value = (form.style?.primaryColor || '#1e3a8a').replace('#', '')
  dialogVisible.value = true
}

function openEdit(row: ContractDesign) {
  editingId.value = row.id
  Object.assign(form, {
    complexId: row.complexId,
    complexName: row.complexName || complexMap.value[row.complexId] || '',
    header: {
      logoUrl: row.header?.logoUrl || '',
      logoPosition: row.header?.logoPosition || 'right',
      title: row.header?.title || 'عقد بيع وحدة سكنية',
      subtitle: row.header?.subtitle || '',
    },
    body: {
      terms: row.body?.terms || '',
      showPaymentTable: row.body?.showPaymentTable ?? true,
    },
    footer: {
      footerText: row.footer?.footerText || '',
      signatures: [...(row.footer?.signatures || [])],
    },
    style: {
      primaryColor: row.style?.primaryColor || '#1e3a8a',
      fontFamily: row.style?.fontFamily || 'Cairo',
    },
  })
  signaturesText.value = (form.footer?.signatures || []).join('\n')
  primaryColorHex.value = (form.style?.primaryColor || '#1e3a8a').replace('#', '')
  dialogVisible.value = true
}

function buildPayload(): CreateContractDesignDto {
  const color = primaryColorHex.value?.startsWith('#')
    ? primaryColorHex.value
    : `#${primaryColorHex.value || '1e3a8a'}`
  const signatures = signaturesText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  syncComplexName()

  return {
    complexId: form.complexId,
    complexName: form.complexName,
    header: {
      logoUrl: form.header?.logoUrl || null,
      logoPosition: form.header?.logoPosition || 'right',
      title: form.header?.title || null,
      subtitle: form.header?.subtitle || null,
    },
    body: {
      terms: form.body?.terms || null,
      showPaymentTable: Boolean(form.body?.showPaymentTable),
    },
    footer: {
      footerText: form.footer?.footerText || null,
      signatures,
    },
    style: {
      primaryColor: color,
      fontFamily: form.style?.fontFamily || 'Cairo',
    },
  }
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  if (!form.header?.title?.trim()) {
    notify.warning('أدخل عنوان العقد')
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await updateContractDesign(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      await createContractDesign(payload)
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

async function remove(row: ContractDesign) {
  if (!(await ask('حذف تصميم العقد؟'))) return
  try {
    await deleteContractDesign(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadLookups()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="تصاميم العقود" subtitle="الشعار والعنوان والألوان والتذييل لكل مجمع">
      <template #actions>
        <Button label="إضافة تصميم" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث..." @search="onSearch">
        <template #filters>
          <Select
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
            @update:model-value="(v: string | null) => setFilter('ComplexId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="5" />
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
        <Column header="المجمع">
          <template #body="{ data }">
            {{ data.complexName || complexMap[data.complexId] || '—' }}
          </template>
        </Column>
        <Column header="العنوان">
          <template #body="{ data }">{{ data.header?.title || '—' }}</template>
        </Column>
        <Column header="اللون" style="width: 90px">
          <template #body="{ data }">
            <span
              class="color-dot"
              :style="{ background: data.style?.primaryColor || '#1e3a8a' }"
              :title="data.style?.primaryColor || ''"
            />
          </template>
        </Column>
        <Column header="الخط" style="width: 140px">
          <template #body="{ data }">{{ data.style?.fontFamily || '—' }}</template>
        </Column>
        <Column header="جدول الأقساط" style="width: 110px">
          <template #body="{ data }">{{ data.body?.showPaymentTable ? 'نعم' : 'لا' }}</template>
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
      :header="editingId ? 'تعديل تصميم عقد' : 'إضافة تصميم عقد'"
      :style="{ width: '720px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
        <div class="field full">
          <label>المجمع</label>
          <Select
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المجمع"
            checkmark
            append-to="body"
            @update:model-value="syncComplexName"
          />
        </div>

        <div class="field full section-title">الترويسة</div>
        <div class="field">
          <label>عنوان العقد</label>
          <InputText v-model="form.header!.title" />
        </div>
        <div class="field">
          <label>موضع الشعار</label>
          <Select
            v-model="form.header!.logoPosition"
            :options="logoPositionOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field full">
          <label>رابط الشعار</label>
          <InputText v-model="form.header!.logoUrl" placeholder="https://..." />
        </div>
        <div class="field full">
          <label>العنوان الفرعي</label>
          <InputText v-model="form.header!.subtitle" placeholder="العنوان | الهاتف" />
        </div>

        <div class="field full section-title">المحتوى</div>
        <div class="field full">
          <label>CSS إضافي (اختياري)</label>
          <Textarea
            v-model="form.body!.terms"
            rows="8"
            auto-resize
            class="css-editor"
            placeholder=".clause-body { font-size: 14px; }
.doc-title-block h1 { color: #1a3d28; }"
          />
          <small class="field-hint">
            الثيم الأساسي مدمج تلقائياً. اكتب هنا تعديلات فقط — لا تلصق ثيم العقد كاملاً حتى لا تتكرر العلامة المائية.
          </small>
        </div>
        <div class="field checkbox-field">
          <Checkbox v-model="form.body!.showPaymentTable" binary input-id="showPaymentTable" />
          <label for="showPaymentTable">إظهار جدول الأقساط</label>
        </div>

        <div class="field full section-title">التذييل</div>
        <div class="field full">
          <label>نص التذييل</label>
          <InputText v-model="form.footer!.footerText" />
        </div>
        <div class="field full">
          <label>التواقيع (سطر لكل توقيع)</label>
          <Textarea v-model="signaturesText" rows="3" auto-resize />
        </div>

        <div class="field full section-title">الأسلوب</div>
        <div class="field">
          <label>اللون الأساسي</label>
          <div class="color-row">
            <ColorPicker v-model="primaryColorHex" />
            <InputText v-model="primaryColorHex" placeholder="1e3a8a" />
          </div>
        </div>
        <div class="field">
          <label>الخط</label>
          <Select
            v-model="form.style!.fontFamily"
            :options="contractFontOptions"
            option-label="label"
            option-value="value"
            editable
            checkmark
            append-to="body"
          />
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
.field.full {
  grid-column: 1 / -1;
}

.section-title {
  margin: 8px 0 0;
  font-weight: 800;
  color: var(--brand);
  font-size: 0.92rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 26px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-dot {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border);
  vertical-align: middle;
}

.css-editor :deep(textarea),
.css-editor {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  direction: ltr;
  text-align: left;
}

.field-hint {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.field-hint code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: var(--surface-2);
  padding: 1px 5px;
  border-radius: 4px;
}
</style>

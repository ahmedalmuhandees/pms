<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ColorPicker from 'primevue/colorpicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { ClausePageGroup, Complex, ContractDesign, CreateContractDesignDto } from '@/types'
import {
  createContractDesign,
  deleteContractDesign,
  getContractDesigns,
  updateContractDesign,
  uploadContractDesignAsset,
  uploadContractDesignLogo,
  uploadContractDesignTemplate,
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
import { fileNameFromPath, resolveMediaUrl } from '@/utils/media'
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
const logoFile = ref<File | null>(null)
const templateFile = ref<File | null>(null)
const cornerFile = ref<File | null>(null)
const middleFile = ref<File | null>(null)
const exteriorFile = ref<File | null>(null)
const logoPreview = ref('')
const cornerPreview = ref('')
const middlePreview = ref('')
const exteriorPreview = ref('')
const currentLogoUrl = ref<string | null>(null)
const currentTemplatePath = ref<string | null>(null)
const currentCornerPath = ref<string | null>(null)
const currentMiddlePath = ref<string | null>(null)
const currentExteriorPath = ref<string | null>(null)
const logoInputRef = ref<HTMLInputElement | null>(null)
const templateInputRef = ref<HTMLInputElement | null>(null)
const cornerInputRef = ref<HTMLInputElement | null>(null)
const middleInputRef = ref<HTMLInputElement | null>(null)
const exteriorInputRef = ref<HTMLInputElement | null>(null)

const contractNumberSideOptions = [
  { label: 'يمين', value: 1 },
  { label: 'يسار', value: 2 },
]

const pageOptions = [
  { label: 'صفحة 2', value: 2 },
  { label: 'صفحة 3', value: 3 },
  { label: 'صفحة 4', value: 4 },
  { label: 'صفحة 5', value: 5 },
  { label: 'صفحة 6', value: 6 },
  { label: 'صفحة 7', value: 7 },
  { label: 'صفحة 8', value: 8 },
]

function normalizeSide(value: unknown): number {
  if (value === 2 || value === 'Left' || value === 'left') return 2
  return 1
}

function defaultClauseGroups(): ClausePageGroup[] {
  return [
    { page: 4, fromClause: 1, toClause: 3 },
    { page: 5, fromClause: 4, toClause: 6 },
    { page: 6, fromClause: 7, toClause: 99 },
  ]
}

const defaultIntroText =
  'بناءاً على رغبة الطرف الاول ( البائع ) ببيع الوحدة السكنية المشيدة على قطعة الأرض المرقمة ({رقم_القطعة}) والمسجلة في دائرة التسجيل العقاري ب({مكان_التسجيل}) ({المقاطعة}).\n' +
  'حيث يتم تنفيذ هذا المشروع ({اسم_المشروع}) من قبل ({اسم_الشركة}) وفق قانون الاستثمار رقم (13) لسنة (2006) والتعديل الوارد عليه بتاريخ (2010/2/8) بموجب إجازة الاستثمار المرقمة ({إجازة_الاستثمار}) الصادرة بتاريخ ({تاريخ_الإجازة}) فقد اتفق الطرفان على ان يقوم الطرف الاول (البائع) ببيع الطرف الثاني (المشتري) الوحدة السكنية المشيدة على القطعة ({رقم_القطعة}) رقم البلوك ( {البناية} ) رقم الطابق ( {الطابق} ) رقم الشقة ( {الشقة} ) وفقا للبنود التالية :-'

function normalizeClauseGroups(groups?: ClausePageGroup[] | null): ClausePageGroup[] {
  if (!groups?.length) return defaultClauseGroups()
  return groups.map((g) => ({
    page: Number(g.page) || 4,
    fromClause: Number(g.fromClause) || 1,
    toClause: Number(g.toClause) || Number(g.fromClause) || 1,
  }))
}

const clauseGroups = ref<ClausePageGroup[]>(defaultClauseGroups())

function addClauseGroup() {
  const last = clauseGroups.value[clauseGroups.value.length - 1]
  const nextFrom = last ? last.toClause + 1 : 1
  clauseGroups.value.push({
    page: last ? last.page + 1 : 4,
    fromClause: nextFrom,
    toClause: nextFrom + 2,
  })
}

function removeClauseGroup(index: number) {
  if (clauseGroups.value.length <= 1) return
  clauseGroups.value.splice(index, 1)
}

function emptyForm(): CreateContractDesignDto {
  return {
    complexId: '',
    complexName: '',
    header: {
      logoUrl: null,
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
    layout: {
      contractNumberSide: 1,
      startPage: 2,
      introPage: 3,
      introText: defaultIntroText,
      introParcelNumber: '',
      introRegistrationPlace: '',
      introDistrict: '',
      introInvestmentLicenseNo: '',
      introInvestmentLicenseDate: '',
      clausesPage: 4,
      clauseGroups: defaultClauseGroups(),
      annexPage: 7,
      sellerSignName: '',
      buyerSignTitle: 'الطرف الثاني (المشتري)',
    },
  }
}

const form = reactive<CreateContractDesignDto>(emptyForm())

function resetFiles() {
  logoFile.value = null
  templateFile.value = null
  cornerFile.value = null
  middleFile.value = null
  exteriorFile.value = null
  logoPreview.value = ''
  cornerPreview.value = ''
  middlePreview.value = ''
  exteriorPreview.value = ''
  currentLogoUrl.value = null
  currentTemplatePath.value = null
  currentCornerPath.value = null
  currentMiddlePath.value = null
  currentExteriorPath.value = null
  if (logoInputRef.value) logoInputRef.value.value = ''
  if (templateInputRef.value) templateInputRef.value.value = ''
  if (cornerInputRef.value) cornerInputRef.value.value = ''
  if (middleInputRef.value) middleInputRef.value.value = ''
  if (exteriorInputRef.value) exteriorInputRef.value.value = ''
}

function bindImageFile(
  event: Event,
  setFile: (f: File | null) => void,
  setPreview: (url: string) => void,
  fallbackUrl: string | null,
) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  setFile(file)
  setPreview(file ? URL.createObjectURL(file) : resolveMediaUrl(fallbackUrl))
}

function onLogoSelected(event: Event) {
  bindImageFile(event, (f) => { logoFile.value = f }, (u) => { logoPreview.value = u }, currentLogoUrl.value)
}

function onTemplateSelected(event: Event) {
  const input = event.target as HTMLInputElement
  templateFile.value = input.files?.[0] || null
}

function onCornerSelected(event: Event) {
  bindImageFile(event, (f) => { cornerFile.value = f }, (u) => { cornerPreview.value = u }, currentCornerPath.value)
}

function onMiddleSelected(event: Event) {
  bindImageFile(event, (f) => { middleFile.value = f }, (u) => { middlePreview.value = u }, currentMiddlePath.value)
}

function onExteriorSelected(event: Event) {
  bindImageFile(event, (f) => { exteriorFile.value = f }, (u) => { exteriorPreview.value = u }, currentExteriorPath.value)
}

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
  clauseGroups.value = defaultClauseGroups()
  signaturesText.value = (form.footer?.signatures || []).join('\n')
  primaryColorHex.value = (form.style?.primaryColor || '#1e3a8a').replace('#', '')
  resetFiles()
  dialogVisible.value = true
}

function openEdit(row: ContractDesign) {
  editingId.value = row.id
  Object.assign(form, {
    complexId: row.complexId,
    complexName: row.complexName || complexMap.value[row.complexId] || '',
    header: {
      logoUrl: row.header?.logoUrl || null,
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
    layout: {
      contractNumberSide: normalizeSide(row.layout?.contractNumberSide),
      startPage: row.layout?.startPage ?? 2,
      introPage: row.layout?.introPage ?? 3,
      introText: row.layout?.introText || defaultIntroText,
      introParcelNumber: row.layout?.introParcelNumber || '',
      introRegistrationPlace: row.layout?.introRegistrationPlace || '',
      introDistrict: row.layout?.introDistrict || '',
      introInvestmentLicenseNo: row.layout?.introInvestmentLicenseNo || '',
      introInvestmentLicenseDate: row.layout?.introInvestmentLicenseDate || '',
      clausesPage: row.layout?.clausesPage ?? 4,
      clauseGroups: normalizeClauseGroups(row.layout?.clauseGroups),
      annexPage: row.layout?.annexPage ?? row.layout?.paymentTablePage ?? 7,
      sellerSignName: row.layout?.sellerSignName || '',
      buyerSignTitle: row.layout?.buyerSignTitle || 'الطرف الثاني (المشتري)',
    },
  })
  clauseGroups.value = normalizeClauseGroups(row.layout?.clauseGroups)
  signaturesText.value = (form.footer?.signatures || []).join('\n')
  primaryColorHex.value = (form.style?.primaryColor || '#1e3a8a').replace('#', '')
  resetFiles()
  currentLogoUrl.value = row.header?.logoUrl || null
  currentTemplatePath.value = row.templatePath || null
  currentCornerPath.value = row.assets?.cornerUnitImagePath || null
  currentMiddlePath.value = row.assets?.middleUnitImagePath || null
  currentExteriorPath.value = row.assets?.complexExteriorImagePath || null
  logoPreview.value = resolveMediaUrl(currentLogoUrl.value)
  cornerPreview.value = resolveMediaUrl(currentCornerPath.value)
  middlePreview.value = resolveMediaUrl(currentMiddlePath.value)
  exteriorPreview.value = resolveMediaUrl(currentExteriorPath.value)
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
      logoPosition: form.header?.logoPosition || 'right',
      title: form.header?.title || null,
      subtitle: form.header?.subtitle || null,
    },
    body: {
      terms: form.body?.terms || '',
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
    layout: {
      contractNumberSide: normalizeSide(form.layout?.contractNumberSide),
      startPage: Number(form.layout?.startPage ?? 2),
      introPage: Number(form.layout?.introPage ?? 3),
      introText: form.layout?.introText?.replace(/\r\n/g, '\n').trim() || null,
      introParcelNumber: form.layout?.introParcelNumber?.trim() || null,
      introRegistrationPlace: form.layout?.introRegistrationPlace?.trim() || null,
      introDistrict: form.layout?.introDistrict?.trim() || null,
      introInvestmentLicenseNo: form.layout?.introInvestmentLicenseNo?.trim() || null,
      introInvestmentLicenseDate: form.layout?.introInvestmentLicenseDate?.trim() || null,
      clausesPage: Number(clauseGroups.value[0]?.page ?? form.layout?.clausesPage ?? 4),
      clauseGroups: normalizeClauseGroups(clauseGroups.value),
      annexPage: Number(form.layout?.annexPage ?? form.layout?.paymentTablePage ?? 7),
      sellerSignName: form.layout?.sellerSignName?.replace(/\r\n/g, '\n').trim() || null,
      buyerSignTitle: form.layout?.buyerSignTitle?.replace(/\r\n/g, '\n').trim() || 'الطرف الثاني (المشتري)',
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
    let designId = editingId.value
    if (designId) {
      await updateContractDesign(designId, payload)
    } else {
      const created = await createContractDesign(payload)
      designId = created.id
    }

    if (logoFile.value && designId) {
      await uploadContractDesignLogo(designId, logoFile.value)
    }
    if (templateFile.value && designId) {
      await uploadContractDesignTemplate(designId, templateFile.value)
    }
    if (cornerFile.value && designId) {
      await uploadContractDesignAsset(designId, 'corner', cornerFile.value)
    }
    if (middleFile.value && designId) {
      await uploadContractDesignAsset(designId, 'middle', middleFile.value)
    }
    if (exteriorFile.value && designId) {
      await uploadContractDesignAsset(designId, 'exterior', exteriorFile.value)
    }

    notify.success(editingId.value ? 'تم التحديث' : 'تم الإنشاء')
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
    <PageHeader title="تصاميم العقود" subtitle="مواضع الصفحات، التواقيع، وصور الوحدات والمجمع لكل تصميم">
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
        <Column header="البائع" style="width: 140px">
          <template #body="{ data }">{{ data.layout?.sellerSignName || '—' }}</template>
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
        <Column header="صور الوحدات" style="width: 110px">
          <template #body="{ data }">
            {{
              [data.assets?.cornerUnitImagePath, data.assets?.middleUnitImagePath, data.assets?.complexExteriorImagePath]
                .filter(Boolean).length
            }}/3
          </template>
        </Column>
        <Column header="القالب" style="width: 90px">
          <template #body="{ data }">{{ data.templatePath ? 'مرفوع' : '—' }}</template>
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
      :style="{ width: '860px' }"
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
          <label>شعار المجمع</label>
          <div class="upload-row">
            <input
              ref="logoInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              @change="onLogoSelected"
            />
            <img v-if="logoPreview" :src="logoPreview" alt="معاينة الشعار" class="logo-preview" />
            <small v-else-if="!currentLogoUrl" class="field-hint">ارفع صورة الشعار (PNG/JPG)</small>
          </div>
        </div>
        <div class="field full">
          <label>ملف قالب العقد</label>
          <div class="upload-row">
            <input
              ref="templateInputRef"
              type="file"
              accept=".pdf,.docx,.doc,.html,.htm,application/pdf"
              @change="onTemplateSelected"
            />
            <small v-if="templateFile" class="field-hint">الملف المختار: {{ templateFile.name }}</small>
            <small v-else-if="currentTemplatePath" class="field-hint">
              الحالي:
              <a :href="resolveMediaUrl(currentTemplatePath)" target="_blank" rel="noopener">
                {{ fileNameFromPath(currentTemplatePath) }}
              </a>
            </small>
            <small v-else class="field-hint">ارفع قالب العقد (PDF أو Word)</small>
          </div>
        </div>
        <div class="field full">
          <label>العنوان الفرعي</label>
          <InputText v-model="form.header!.subtitle" placeholder="العنوان | الهاتف" />
        </div>

        <div class="field full section-title">مواضع العقد</div>
        <div class="field">
          <label>رقم العقد</label>
          <Select
            v-model="form.layout!.contractNumberSide"
            :options="contractNumberSideOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
          <small class="field-hint">يمين أو يسار الصفحة</small>
        </div>
        <div class="field">
          <label>صفحة البداية (الأطراف)</label>
          <Select
            v-model="form.layout!.startPage"
            :options="pageOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
          <small class="field-hint">الغلاف دائماً صفحة 1</small>
        </div>
        <div class="field">
          <label>صفحة المقدمة</label>
          <Select
            v-model="form.layout!.introPage"
            :options="pageOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
          <small class="field-hint">اختر نفس صفحة البداية لدمجها معها، أو صفحة أخرى لتكون منفصلة</small>
        </div>
        <div class="field full section-title">نص ومغيرات المقدمة</div>
        <div class="field">
          <label>رقم القطعة ({رقم_القطعة})</label>
          <InputText v-model="form.layout!.introParcelNumber" placeholder="مثال: 59/1" />
        </div>
        <div class="field">
          <label>مكان التسجيل ({مكان_التسجيل})</label>
          <InputText
            v-model="form.layout!.introRegistrationPlace"
            placeholder="مثال: محافظة بغداد ( قضاء الرصافة )"
          />
        </div>
        <div class="field full">
          <label>المقاطعة / الموقع ({المقاطعة})</label>
          <InputText
            v-model="form.layout!.introDistrict"
            placeholder="مثال: مقاطعة الزعفرانية الواقعة في محافظة بغداد قضاء الرصافة"
          />
        </div>
        <div class="field">
          <label>إجازة الاستثمار ({إجازة_الاستثمار})</label>
          <InputText v-model="form.layout!.introInvestmentLicenseNo" placeholder="مثال: 283/20/6" />
        </div>
        <div class="field">
          <label>تاريخ الإجازة ({تاريخ_الإجازة})</label>
          <InputText v-model="form.layout!.introInvestmentLicenseDate" placeholder="مثال: 2021/6/20" />
        </div>
        <div class="field full">
          <label>نص مقدمة العقد</label>
          <Textarea
            v-model="form.layout!.introText"
            rows="7"
            auto-resize
            :placeholder="defaultIntroText"
          />
          <small class="field-hint">
            ضع المتغيرات داخل أقواس هكذا: ({رقم_القطعة}) — تُملأ تلقائياً.
            تلقائي من الوحدة: ({البناية}) ({الطابق}) ({الشقة}) — ومن العقد: ({اسم_المشروع}) ({اسم_الشركة}).
            Enter لسطر جديد.
          </small>
        </div>
        <div class="field">
          <label>صفحة ملحق العقد</label>
          <Select
            v-model="form.layout!.annexPage"
            :options="pageOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
          <small class="field-hint">صفحة منفصلة بعد البنود (بيانات مالية + جدول المدفوعات)</small>
        </div>

        <div class="field full section-title">توزيع البنود على الصفحات</div>
        <div class="field full">
          <small class="field-hint" style="margin-bottom: 8px">
            مثال: صفحة 4 → البنود 1–3، صفحة 5 → البنود 4–6. البنود الزائدة عن آخر نطاق لا تُطبع إلا إذا وسّعت «إلى».
          </small>
          <div
            v-for="(group, index) in clauseGroups"
            :key="index"
            class="clause-group-row"
          >
            <div class="field">
              <label>الصفحة</label>
              <Select
                v-model="group.page"
                :options="pageOptions"
                option-label="label"
                option-value="value"
                checkmark
                append-to="body"
              />
            </div>
            <div class="field">
              <label>من بند</label>
              <InputNumber v-model="group.fromClause" :min="1" :max="99" show-buttons />
            </div>
            <div class="field">
              <label>إلى بند</label>
              <InputNumber v-model="group.toClause" :min="1" :max="99" show-buttons />
            </div>
            <div class="clause-group-actions">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                :disabled="clauseGroups.length <= 1"
                @click="removeClauseGroup(index)"
              />
            </div>
          </div>
          <Button
            label="إضافة مجموعة بنود"
            icon="pi pi-plus"
            severity="secondary"
            outlined
            size="small"
            class="mt-2"
            @click="addClauseGroup"
          />
        </div>

        <div class="field full section-title">التواقيع</div>
        <div class="field full">
          <label>الطرف الأول (البائع) — الاسم</label>
          <Textarea
            v-model="form.layout!.sellerSignName"
            rows="3"
            auto-resize
            placeholder="اسم الشركة / الممثل&#10;سطر إضافي إن لزم"
          />
          <small class="field-hint">Enter لسطر جديد</small>
        </div>
        <div class="field full">
          <label>تسمية الطرف الثاني</label>
          <Textarea
            v-model="form.layout!.buyerSignTitle"
            rows="2"
            auto-resize
            placeholder="الطرف الثاني (المشتري)"
          />
          <small class="field-hint">اسم المشتري يُؤخذ تلقائياً من صفحة العقد — Enter لسطر جديد في التسمية</small>
        </div>

        <div class="field full section-title">صور الوحدات والمجمع</div>
        <div class="field">
          <label>صورة الوحدة الطرفية</label>
          <div class="upload-row">
            <input
              ref="cornerInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="onCornerSelected"
            />
            <img v-if="cornerPreview" :src="cornerPreview" alt="طرفية" class="asset-preview" />
            <small class="field-hint">تظهر للعقد إذا كانت الوحدة طرفية + جدول البناية/الطابق/الشقة/توقيع المشتري</small>
          </div>
        </div>
        <div class="field">
          <label>صورة الوحدة الوسطية</label>
          <div class="upload-row">
            <input
              ref="middleInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="onMiddleSelected"
            />
            <img v-if="middlePreview" :src="middlePreview" alt="وسطية" class="asset-preview" />
            <small class="field-hint">تظهر للعقد إذا كانت الوحدة وسطية</small>
          </div>
        </div>
        <div class="field full">
          <label>صورة المجمع من الخارج (آخر ورقة)</label>
          <div class="upload-row">
            <input
              ref="exteriorInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="onExteriorSelected"
            />
            <img v-if="exteriorPreview" :src="exteriorPreview" alt="خارجي" class="asset-preview wide" />
            <small class="field-hint">تُطبع كآخر صفحة في العقد</small>
          </div>
        </div>

        <div class="field full section-title">المحتوى</div>
        <div class="field full">
          <label>CSS إضافي (اختياري)</label>
          <Textarea
            v-model="form.body!.terms"
            rows="6"
            auto-resize
            class="css-editor"
            placeholder=".clause-body { font-size: 14px; }"
          />
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
          <label>التواقيع الإضافية (سطر لكل توقيع)</label>
          <Textarea v-model="signaturesText" rows="2" auto-resize />
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

.upload-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logo-preview,
.logo-thumb,
.asset-preview {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
}

.asset-preview.wide {
  width: 160px;
  height: 90px;
  object-fit: cover;
}

.logo-thumb {
  width: 36px;
  height: 36px;
}

.clause-group-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr auto;
  gap: 10px;
  align-items: end;
  margin-bottom: 10px;
}

.clause-group-actions {
  padding-bottom: 4px;
}

.mt-2 {
  margin-top: 8px;
}

@media (max-width: 720px) {
  .clause-group-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import type {
  Complex,
  Customer,
  KeyHandoverDto,
  OccupancyDto,
  ResidentContractUnit,
} from '@/types'
import { FamilyRelation, OccupancyType, UnitResidentPhase } from '@/types'
import {
  deleteResidentContract,
  downloadHandoverPdf,
  downloadOccupancyPdf,
  getKeyHandover,
  getOccupancy,
  getResidentContractUnits,
  uploadHandoverPhoto,
  uploadOccupancyIdentity,
  upsertKeyHandover,
  upsertOccupancy,
  type ResidentContractParams,
} from '@/api/residentContracts'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  familyRelationOptions,
  labelOf,
  occupancyFormTypeOptions,
  unitResidentPhaseOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const notify = useNotify()
const { ask } = useConfirmAction()

const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const complexFilter = ref<string | null>(auth.scopedComplexId)
const phaseFilter = ref<number | null>(null)
const buildingFilter = ref<string | null>((route.query.buildingId as string) || null)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<ResidentContractUnit, ResidentContractParams>(getResidentContractUnits)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const customerOptions = computed(() => {
  const cid = activeComplexId.value
  const list = cid ? customers.value.filter((c) => c.complexId === cid) : customers.value
  return asSelectOptions(list, (c) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id)
})

const activeComplexId = computed(
  () => complexFilter.value || auth.scopedComplexId || items.value[0]?.complexId || '',
)

const activeUnit = ref<ResidentContractUnit | null>(null)
const handoverVisible = ref(false)
const occupancyVisible = ref(false)
const saving = ref(false)
const receivedAtModel = ref<Date | null>(null)
const occupancyDateModel = ref<Date | null>(null)

const handoverForm = reactive<KeyHandoverDto>({
  customerId: null,
  recipientName: '',
  recipientNationalId: '',
  recipientPhone: '',
  receivedAt: new Date().toISOString(),
  keysCount: 1,
  accessCardsCount: 0,
  electricityReading: null,
  electricityMeterPhotoUrl: null,
  waterReading: null,
  waterMeterPhotoUrl: null,
  gasReading: null,
  gasMeterPhotoUrl: null,
  engineerName: '',
  engineerNotes: '',
  generalNotes: '',
})

const occupancyForm = reactive<OccupancyDto>({
  customerId: null,
  primaryResidentName: '',
  primaryResidentNationalId: '',
  occupancyDate: new Date().toISOString(),
  identityDocumentUrl: null,
  totalOccupants: 1,
  maleCount: 1,
  femaleCount: 0,
  occupancyType: OccupancyType.Owner,
  emergencyContactName: '',
  emergencyRelation: FamilyRelation.Other,
  emergencyPhone: '',
  familyMembers: [],
})

const printMenu = ref<InstanceType<typeof Menu> | null>(null)
const printUnit = ref<ResidentContractUnit | null>(null)
const printItems = computed<MenuItem[]>(() => [
  {
    label: 'محضر تسليم المفاتيح',
    icon: 'pi pi-key',
    disabled: !printUnit.value?.hasHandover,
    command: () => {
      if (printUnit.value) void openPdfBlob(downloadHandoverPdf(printUnit.value.unitId))
    },
  },
  {
    label: 'نموذج التسكين',
    icon: 'pi pi-home',
    disabled: !printUnit.value?.hasOccupancy,
    command: () => {
      if (printUnit.value) void openPdfBlob(downloadOccupancyPdf(printUnit.value.unitId))
    },
  },
])

function phaseLabel(phase: number) {
  return labelOf(unitResidentPhaseOptions, phase)
}

async function loadLookups() {
  const [complexResult, customerResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
}

function resetHandoverForm() {
  Object.assign(handoverForm, {
    customerId: null,
    recipientName: '',
    recipientNationalId: '',
    recipientPhone: '',
    receivedAt: new Date().toISOString(),
    keysCount: 1,
    accessCardsCount: 0,
    electricityReading: null,
    electricityMeterPhotoUrl: null,
    waterReading: null,
    waterMeterPhotoUrl: null,
    gasReading: null,
    gasMeterPhotoUrl: null,
    engineerName: '',
    engineerNotes: '',
    generalNotes: '',
  })
  receivedAtModel.value = new Date()
}

function resetOccupancyForm() {
  Object.assign(occupancyForm, {
    customerId: null,
    primaryResidentName: '',
    primaryResidentNationalId: '',
    occupancyDate: new Date().toISOString(),
    identityDocumentUrl: null,
    totalOccupants: 1,
    maleCount: 1,
    femaleCount: 0,
    occupancyType: OccupancyType.Owner,
    emergencyContactName: '',
    emergencyRelation: FamilyRelation.Other,
    emergencyPhone: '',
    familyMembers: [],
  })
  occupancyDateModel.value = new Date()
}

function syncFamilyRows() {
  const needed = Math.max(0, (occupancyForm.maleCount || 0) + (occupancyForm.femaleCount || 0))
  occupancyForm.totalOccupants = needed
  const current = [...occupancyForm.familyMembers]
  while (current.length < needed) {
    current.push({
      fullName: '',
      relation: FamilyRelation.Other,
      nationalId: '',
      birthDate: null,
    })
  }
  occupancyForm.familyMembers = current.slice(0, Math.max(needed, current.length))
}

async function openHandover(row: ResidentContractUnit) {
  activeUnit.value = row
  resetHandoverForm()
  if (row.hasHandover) {
    try {
      const data = await getKeyHandover(row.unitId)
      Object.assign(handoverForm, data)
      receivedAtModel.value = data.receivedAt ? new Date(data.receivedAt) : new Date()
    } catch {
      /* new form */
    }
  } else if (row.customerId) {
    handoverForm.customerId = row.customerId
    handoverForm.recipientName = row.customerName || ''
  }
  handoverVisible.value = true
}

async function openOccupancy(row: ResidentContractUnit) {
  activeUnit.value = row
  resetOccupancyForm()
  if (row.hasOccupancy) {
    try {
      const data = await getOccupancy(row.unitId)
      Object.assign(occupancyForm, {
        ...data,
        familyMembers: data.familyMembers?.length ? data.familyMembers : [],
      })
      occupancyDateModel.value = data.occupancyDate ? new Date(data.occupancyDate) : new Date()
    } catch {
      /* new form */
    }
  } else if (row.customerId) {
    occupancyForm.customerId = row.customerId
    occupancyForm.primaryResidentName = row.customerName || ''
  }
  syncFamilyRows()
  occupancyVisible.value = true
}

async function openEdit(row: ResidentContractUnit) {
  if (row.hasOccupancy) await openOccupancy(row)
  else if (row.hasHandover) await openHandover(row)
  else await openHandover(row)
}

async function saveHandover() {
  if (!activeUnit.value) return
  if (!receivedAtModel.value) {
    notify.warning('حدد تاريخ الاستلام')
    return
  }
  handoverForm.receivedAt = receivedAtModel.value.toISOString()
  saving.value = true
  try {
    await upsertKeyHandover(activeUnit.value.unitId, { ...handoverForm })
    notify.success('تم حفظ تسليم المفتاح')
    handoverVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function saveOccupancy() {
  if (!activeUnit.value) return
  if (!occupancyDateModel.value) {
    notify.warning('حدد تاريخ التسكين')
    return
  }
  occupancyForm.occupancyDate = occupancyDateModel.value.toISOString()
  occupancyForm.totalOccupants = (occupancyForm.maleCount || 0) + (occupancyForm.femaleCount || 0)
  occupancyForm.familyMembers = occupancyForm.familyMembers
    .slice(0, occupancyForm.totalOccupants)
    .map((m) => ({
      ...m,
      birthDate: m.birthDate || null,
    }))
  saving.value = true
  try {
    await upsertOccupancy(activeUnit.value.unitId, { ...occupancyForm })
    notify.success('تم حفظ التسكين')
    occupancyVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function onMeterPhoto(
  kind: 'electricity' | 'water' | 'gas',
  event: Event,
) {
  if (!activeUnit.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const { path } = await uploadHandoverPhoto(activeUnit.value.unitId, kind, file)
    if (kind === 'electricity') handoverForm.electricityMeterPhotoUrl = path
    if (kind === 'water') handoverForm.waterMeterPhotoUrl = path
    if (kind === 'gas') handoverForm.gasMeterPhotoUrl = path
    notify.success('تم رفع الصورة')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    input.value = ''
  }
}

async function onIdentityPhoto(event: Event) {
  if (!activeUnit.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const { path } = await uploadOccupancyIdentity(activeUnit.value.unitId, file)
    occupancyForm.identityDocumentUrl = path
    notify.success('تم رفع صورة الهوية')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    input.value = ''
  }
}

async function remove(row: ResidentContractUnit) {
  if (!(await ask('حذف سجلات تسليم المفتاح والتسكين لهذه الوحدة؟'))) return
  try {
    await deleteResidentContract(row.unitId)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function showPrintMenu(event: Event, row: ResidentContractUnit) {
  printUnit.value = row
  printMenu.value?.toggle(event)
}

async function openPdfBlob(promise: Promise<Blob>) {
  try {
    const blob = await promise
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

watch([() => occupancyForm.maleCount, () => occupancyForm.femaleCount], () => {
  syncFamilyRows()
})

watch(complexFilter, (v) => setFilter('ComplexId', v || undefined))
watch(phaseFilter, (v) => {
  const label =
    v === UnitResidentPhase.Available
      ? 'Available'
      : v === UnitResidentPhase.KeyHandedOver
        ? 'KeyHandedOver'
        : v === UnitResidentPhase.Occupied
          ? 'Occupied'
          : undefined
  setFilter('Phase', label)
})

onMounted(async () => {
  try {
    await loadLookups()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  if (complexFilter.value) setFilter('ComplexId', complexFilter.value)
  if (buildingFilter.value) setFilter('BuildingId', buildingFilter.value)
  if (phaseFilter.value != null) {
    const v = phaseFilter.value
    const label =
      v === UnitResidentPhase.Available
        ? 'Available'
        : v === UnitResidentPhase.KeyHandedOver
          ? 'KeyHandedOver'
          : 'Occupied'
    setFilter('Phase', label)
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="عقود الساكنين" subtitle="تسليم المفاتيح والتسكين وطباعة المحاضر للوحدات">
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث برقم الوحدة..." @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode">
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
          />
          <Select
            v-model="phaseFilter"
            :options="unitResidentPhaseOptions"
            option-label="label"
            option-value="value"
            placeholder="متاح / ساكن / تسليم مفتاح"
            show-clear
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
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
        <Column header="الوحدة" style="width: 110px" sortable>
          <template #body="{ data }">{{ data.unitNumber }}</template>
        </Column>
        <Column header="المبنى" sortable>
          <template #body="{ data }">{{ data.buildingName || '—' }}</template>
        </Column>
        <Column header="البلوك" sortable>
          <template #body="{ data }">{{ data.blockName || '—' }}</template>
        </Column>
        <Column header="المساحة" style="width: 100px" sortable>
          <template #body="{ data }">{{ data.area }}</template>
        </Column>
        <Column header="الحالة" style="width: 120px" sortable>
          <template #body="{ data }">
            <span class="phase-pill" :data-phase="data.phase">{{ phaseLabel(data.phase) }}</span>
          </template>
        </Column>
        <Column header="الساكن" sortable>
          <template #body="{ data }">{{ data.customerName || '—' }}</template>
        </Column>
        <Column header="إجراءات" style="width: 320px">
          <template #body="{ data }">
            <div class="row-btns">
              <Button
                label="تسليم مفتاح"
                icon="pi pi-key"
                size="small"
                severity="secondary"
                outlined
                @click="openHandover(data)"
              />
              <Button
                label="تسكين"
                icon="pi pi-home"
                size="small"
                severity="help"
                outlined
                @click="openOccupancy(data)"
              />
              <Button
                icon="pi pi-pencil"
                size="small"
                text
                rounded
                v-tooltip.top="'تعديل'"
                @click="openEdit(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                text
                rounded
                severity="danger"
                v-tooltip.top="'حذف'"
                @click="remove(data)"
              />
              <Button
                icon="pi pi-print"
                size="small"
                text
                rounded
                v-tooltip.top="'طباعة'"
                :disabled="!data.hasHandover && !data.hasOccupancy"
                @click="showPrintMenu($event, data)"
              />
            </div>
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد وحدات</div></template>
      </DataTable>
      </template>
    </div>

    <Menu ref="printMenu" :model="printItems" popup />

    <!-- Handover dialog -->
    <Dialog
      v-model:visible="handoverVisible"
      modal
      header="تسليم مفتاح"
      :style="{ width: '720px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>تاريخ الاستلام</label>
          <DatePicker v-model="receivedAtModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>العميل (اختياري)</label>
          <Select
            v-model="handoverForm.customerId"
            :options="customerOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر العميل"
            show-clear
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>اسم المستلم</label>
          <InputText v-model="handoverForm.recipientName" class="w-full" />
        </div>
        <div class="field">
          <label>رقم الهوية / الجواز</label>
          <InputText v-model="handoverForm.recipientNationalId" class="w-full" />
        </div>
        <div class="field">
          <label>الهاتف</label>
          <InputText v-model="handoverForm.recipientPhone" class="w-full" />
        </div>
        <div class="field">
          <label>عدد المفاتيح المستلمة</label>
          <InputNumber v-model="handoverForm.keysCount" :min="0" />
        </div>
        <div class="field">
          <label>عدد بطاقات / ريموتات الدخول</label>
          <InputNumber v-model="handoverForm.accessCardsCount" :min="0" />
        </div>
        <div class="field">
          <label>قراءة عداد الكهرباء (اختياري)</label>
          <InputNumber v-model="handoverForm.electricityReading" :min-fraction-digits="0" :max-fraction-digits="2" />
          <input type="file" accept="image/*" class="file-input" @change="onMeterPhoto('electricity', $event)" />
          <small v-if="handoverForm.electricityMeterPhotoUrl">تم إرفاق صورة</small>
        </div>
        <div class="field">
          <label>قراءة عداد الماء (اختياري)</label>
          <InputNumber v-model="handoverForm.waterReading" :min-fraction-digits="0" :max-fraction-digits="2" />
          <input type="file" accept="image/*" class="file-input" @change="onMeterPhoto('water', $event)" />
          <small v-if="handoverForm.waterMeterPhotoUrl">تم إرفاق صورة</small>
        </div>
        <div class="field">
          <label>قراءة عداد الغاز (اختياري)</label>
          <InputNumber v-model="handoverForm.gasReading" :min-fraction-digits="0" :max-fraction-digits="2" />
          <input type="file" accept="image/*" class="file-input" @change="onMeterPhoto('gas', $event)" />
          <small v-if="handoverForm.gasMeterPhotoUrl">تم إرفاق صورة</small>
        </div>
        <div class="field">
          <label>اسم المهندس المرافق</label>
          <InputText v-model="handoverForm.engineerName" class="w-full" />
        </div>
        <div class="field full">
          <label>ملاحظات المهندس</label>
          <InputText v-model="handoverForm.engineerNotes" class="w-full" />
        </div>
        <div class="field full">
          <label>ملاحظات</label>
          <InputText v-model="handoverForm.generalNotes" class="w-full" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="handoverVisible = false" />
          <Button label="حفظ" :loading="saving" @click="saveHandover" />
        </div>
      </template>
    </Dialog>

    <!-- Occupancy dialog -->
    <Dialog
      v-model:visible="occupancyVisible"
      modal
      header="تسكين"
      :style="{ width: '820px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>تاريخ التسكين</label>
          <DatePicker v-model="occupancyDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>حالة الإشغال</label>
          <Select
            v-model="occupancyForm.occupancyType"
            :options="occupancyFormTypeOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>العميل (اختياري)</label>
          <Select
            v-model="occupancyForm.customerId"
            :options="customerOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر العميل"
            show-clear
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>اسم الساكن الرئيسي</label>
          <InputText v-model="occupancyForm.primaryResidentName" class="w-full" />
        </div>
        <div class="field">
          <label>رقم الهوية / الجواز</label>
          <InputText v-model="occupancyForm.primaryResidentNationalId" class="w-full" />
        </div>
        <div class="field">
          <label>صورة الهوية / جواز السفر</label>
          <input type="file" accept="image/*,application/pdf" class="file-input" @change="onIdentityPhoto" />
          <small v-if="occupancyForm.identityDocumentUrl">تم إرفاق الملف</small>
        </div>
        <div class="field">
          <label>عدد الذكور</label>
          <InputNumber v-model="occupancyForm.maleCount" :min="0" />
        </div>
        <div class="field">
          <label>عدد الإناث</label>
          <InputNumber v-model="occupancyForm.femaleCount" :min="0" />
        </div>
        <div class="field">
          <label>إجمالي القاطنين</label>
          <InputNumber :model-value="occupancyForm.totalOccupants" disabled />
        </div>

        <div class="field full" v-if="occupancyForm.familyMembers.length">
          <label>أفراد الأسرة</label>
          <div class="family-table">
            <div
              v-for="(member, idx) in occupancyForm.familyMembers"
              :key="idx"
              class="family-row"
            >
              <InputText v-model="member.fullName" placeholder="الاسم الكامل" class="w-full" />
              <Select
                v-model="member.relation"
                :options="familyRelationOptions"
                option-label="label"
                option-value="value"
                placeholder="صلة القرابة"
                append-to="body"
              />
              <InputText v-model="member.nationalId" placeholder="رقم الهوية" class="w-full" />
              <DatePicker
                :model-value="member.birthDate ? new Date(member.birthDate) : null"
                date-format="yy-mm-dd"
                show-icon
                show-clear
                placeholder="تاريخ الميلاد"
                @update:model-value="(v) => { member.birthDate = v instanceof Date ? v.toISOString() : null }"
              />
            </div>
          </div>
        </div>

        <div class="field">
          <label>اسم شخص الطوارئ</label>
          <InputText v-model="occupancyForm.emergencyContactName" class="w-full" />
        </div>
        <div class="field">
          <label>صلة القرابة</label>
          <Select
            v-model="occupancyForm.emergencyRelation"
            :options="familyRelationOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>رقم هاتف الطوارئ</label>
          <InputText v-model="occupancyForm.emergencyPhone" class="w-full" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="occupancyVisible = false" />
          <Button label="حفظ" :loading="saving" @click="saveOccupancy" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.row-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.phase-pill {
  display: inline-flex;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #eef2ff;
  color: #3730a3;
}
.phase-pill[data-phase='1'] {
  background: #ecfdf5;
  color: #047857;
}
.phase-pill[data-phase='2'] {
  background: #fff7ed;
  color: #c2410c;
}
.phase-pill[data-phase='3'] {
  background: #eff6ff;
  color: #1d4ed8;
}
.file-input {
  margin-top: 6px;
  font-size: 0.8rem;
}
.field.full {
  grid-column: 1 / -1;
}
.family-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.family-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 8px;
}
@media (max-width: 780px) {
  .family-row {
    grid-template-columns: 1fr;
  }
}
</style>

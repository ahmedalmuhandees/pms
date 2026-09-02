<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import type { Unit, UnitDocument, UnitImage } from '@/types'
import { getUnit } from '@/api/units'
import {
  deleteUnitImage,
  getUnitImages,
  updateUnitImage,
  uploadUnitImage,
} from '@/api/unitImages'
import {
  deleteUnitDocument,
  getUnitDocuments,
  updateUnitDocument,
  uploadUnitDocument,
} from '@/api/unitDocuments'
import { getErrorMessage } from '@/api/client'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import {
  formatDate,
  formatMoney,
  labelOf,
  unitStatusOptions,
  unitTypeOptions,
  unitUiOptions,
} from '@/utils/enums'

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const { ask } = useConfirmAction()
const unitId = computed(() => String(route.params.id))

const loading = ref(true)
const unit = ref<Unit | null>(null)
const images = ref<UnitImage[]>([])
const documents = ref<UnitDocument[]>([])
const activeTab = ref('images')

const uploadingImage = ref(false)
const uploadingDoc = ref(false)
const docTitle = ref('')
const docFile = ref<File | null>(null)

const editImageVisible = ref(false)
const editDocVisible = ref(false)
const savingMedia = ref(false)
const editingImage = ref<UnitImage | null>(null)
const editingDoc = ref<UnitDocument | null>(null)
const editSortOrder = ref(0)
const editDocTitle = ref('')

const imageInputRef = ref<HTMLInputElement | null>(null)
const docInputRef = ref<HTMLInputElement | null>(null)

const apiOrigin = import.meta.env.VITE_API_BASE_URL || 'https://pmsaas-api.execute-iq.com'

function mediaUrl(path: string | null | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiOrigin.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

async function loadImages() {
  const data = await getUnitImages(unitId.value, { Page: 1, PageSize: 100 })
  images.value = data.items ?? []
}

async function loadDocuments() {
  const data = await getUnitDocuments(unitId.value, { Page: 1, PageSize: 100 })
  documents.value = data.items ?? []
}

async function loadAll() {
  loading.value = true
  try {
    const [unitData] = await Promise.all([
      getUnit(unitId.value),
      loadImages(),
      loadDocuments(),
    ])
    unit.value = unitData
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

function triggerImageUpload() {
  imageInputRef.value?.click()
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploadingImage.value = true
  try {
    const sortOrder = images.value.length
    await uploadUnitImage(unitId.value, file, sortOrder)
    notify.success('تم رفع الصورة بنجاح')
    await loadImages()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    uploadingImage.value = false
  }
}

function openEditImage(img: UnitImage) {
  editingImage.value = img
  editSortOrder.value = img.sortOrder
  editImageVisible.value = true
}

async function saveImageSort() {
  if (!editingImage.value) return
  savingMedia.value = true
  try {
    await updateUnitImage(unitId.value, editingImage.value.id, editSortOrder.value)
    notify.success('تم تحديث ترتيب الصورة')
    editImageVisible.value = false
    await loadImages()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    savingMedia.value = false
  }
}

async function removeImage(img: UnitImage) {
  if (!(await ask('حذف هذه الصورة نهائياً؟', 'تأكيد الحذف'))) return
  try {
    await deleteUnitImage(unitId.value, img.id)
    notify.success('تم حذف الصورة')
    images.value = images.value.filter((i) => i.id !== img.id)
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function triggerDocUpload() {
  docInputRef.value?.click()
}

function onDocFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  docFile.value = file
  if (!docTitle.value.trim()) {
    docTitle.value = file.name.replace(/\.[^.]+$/, '')
  }
}

async function uploadDocument() {
  if (!docFile.value) {
    notify.warning('اختر ملفاً أولاً')
    return
  }
  if (!docTitle.value.trim()) {
    notify.warning('أدخل عنوان المستند')
    return
  }
  uploadingDoc.value = true
  try {
    await uploadUnitDocument(unitId.value, docFile.value, docTitle.value.trim())
    notify.success('تم رفع المستند بنجاح')
    docTitle.value = ''
    docFile.value = null
    await loadDocuments()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    uploadingDoc.value = false
  }
}

function openEditDoc(doc: UnitDocument) {
  editingDoc.value = doc
  editDocTitle.value = doc.title || ''
  editDocVisible.value = true
}

async function saveDocTitle() {
  if (!editingDoc.value) return
  if (!editDocTitle.value.trim()) {
    notify.warning('أدخل عنوان المستند')
    return
  }
  savingMedia.value = true
  try {
    await updateUnitDocument(unitId.value, editingDoc.value.id, editDocTitle.value.trim())
    notify.success('تم تحديث عنوان المستند')
    editDocVisible.value = false
    await loadDocuments()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    savingMedia.value = false
  }
}

async function removeDocument(doc: UnitDocument) {
  if (!(await ask(`حذف المستند "${doc.title || 'بدون عنوان'}"؟`, 'تأكيد الحذف'))) return
  try {
    await deleteUnitDocument(unitId.value, doc.id)
    notify.success('تم حذف المستند')
    documents.value = documents.value.filter((d) => d.id !== doc.id)
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(() => void loadAll())
</script>

<template>
  <div class="page">
    <div v-if="loading" class="page-loading">
      <ProgressSpinner stroke-width="4" />
    </div>

    <PageHeader
      :title="`تفاصيل الوحدة ${unit?.unitNumber || ''}`"
      subtitle="بيانات الوحدة مع إدارة الصور والمستندات"
    >
      <template #actions>
        <Button label="العودة إلى الوحدات" icon="pi pi-arrow-right" severity="secondary" outlined @click="router.push('/units')" />
      </template>
    </PageHeader>

    <div v-if="unit" class="data-panel">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">رقم الوحدة</span>
          <span class="detail-value">{{ unit.unitNumber }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">النوع</span>
          <span class="detail-value">{{ labelOf(unitTypeOptions, unit.unitType) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">الحالة</span>
          <span class="detail-value">{{ labelOf(unitStatusOptions, unit.status) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">المساحة</span>
          <span class="detail-value">{{ unit.area }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">غرف النوم</span>
          <span class="detail-value">{{ unit.bedrooms }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">الحمامات</span>
          <span class="detail-value">{{ unit.bathrooms }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">السعر</span>
          <span class="detail-value">{{ formatMoney(unit.price) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">التكلفة</span>
          <span class="detail-value">{{ formatMoney(unit.cost) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">موقع الوحدة</span>
          <span class="detail-value">{{ labelOf(unitUiOptions, unit.unitUi) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">الاتجاه</span>
          <span class="detail-value">{{ unit.direction || '—' }}</span>
        </div>
        <div class="detail-item full">
          <span class="detail-label">ملاحظات</span>
          <span class="detail-value">{{ unit.notes || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="data-panel media-panel">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="images">
            <span class="tab-label">
              <i class="pi pi-image" />
              الصور
              <span class="tab-count">{{ images.length }}</span>
            </span>
          </Tab>
          <Tab value="documents">
            <span class="tab-label">
              <i class="pi pi-folder-open" />
              المستندات
              <span class="tab-count">{{ documents.length }}</span>
            </span>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="images">
            <div class="media-toolbar">
              <div>
                <h3>صور الوحدة</h3>
                <p>ارفع صوراً للوحدة ورتّبها حسب الظهور</p>
              </div>
              <input
                ref="imageInputRef"
                type="file"
                accept="image/*"
                hidden
                @change="onImageSelected"
              />
              <Button
                label="رفع صورة"
                icon="pi pi-upload"
                :loading="uploadingImage"
                @click="triggerImageUpload"
              />
            </div>

            <div v-if="images.length" class="media-grid">
              <article v-for="img in images" :key="img.id" class="media-card">
                <div class="media-thumb">
                  <img :src="mediaUrl(img.imagePath)" :alt="`صورة ${img.sortOrder}`" />
                  <span class="sort-badge">ترتيب {{ img.sortOrder }}</span>
                </div>
                <div class="media-body">
                  <div class="media-date">{{ formatDate(img.createdAt) }}</div>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="action-btn is-edit"
                      v-tooltip.top="'تعديل الترتيب'"
                      aria-label="تعديل الترتيب"
                      @click="openEditImage(img)"
                    >
                      <i class="pi pi-pencil" />
                    </button>
                    <button
                      type="button"
                      class="action-btn is-delete"
                      v-tooltip.top="'حذف'"
                      aria-label="حذف"
                      @click="removeImage(img)"
                    >
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="empty-box">لا توجد صور لهذه الوحدة بعد</div>
          </TabPanel>

          <TabPanel value="documents">
            <div class="media-toolbar">
              <div>
                <h3>مستندات الوحدة</h3>
                <p>عقود، مخططات، ومستندات مرتبطة بالوحدة</p>
              </div>
            </div>

            <div class="doc-upload-bar">
              <InputText
                v-model="docTitle"
                placeholder="عنوان المستند"
                class="doc-title-input"
              />
              <input ref="docInputRef" type="file" hidden @change="onDocFileSelected" />
              <Button
                :label="docFile ? 'تغيير الملف' : 'اختيار ملف'"
                icon="pi pi-file"
                severity="secondary"
                outlined
                @click="triggerDocUpload"
              />
              <span v-if="docFile" class="file-name">{{ docFile.name }}</span>
              <Button
                label="رفع مستند"
                icon="pi pi-upload"
                :loading="uploadingDoc"
                @click="uploadDocument"
              />
            </div>

            <DataTable
              :value="documents"
              striped-rows
              size="small"
            >
              <Column field="title" header="العنوان" />
              <Column header="تاريخ الرفع" style="width: 140px">
                <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
              </Column>
              <Column header="الملف">
                <template #body="{ data }">
                  <a
                    v-if="data.documentPath"
                    class="file-link"
                    :href="mediaUrl(data.documentPath)"
                    target="_blank"
                    rel="noopener"
                  >
                    <i class="pi pi-external-link" />
                    فتح الملف
                  </a>
                  <span v-else>—</span>
                </template>
              </Column>
              <Column header="إجراءات" style="width: 130px">
                <template #body="{ data }">
                  <div class="row-actions">
                    <button
                      type="button"
                      class="action-btn is-edit"
                      v-tooltip.top="'تعديل العنوان'"
                      aria-label="تعديل العنوان"
                      @click="openEditDoc(data)"
                    >
                      <i class="pi pi-pencil" />
                    </button>
                    <button
                      type="button"
                      class="action-btn is-delete"
                      v-tooltip.top="'حذف'"
                      aria-label="حذف"
                      @click="removeDocument(data)"
                    >
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </template>
              </Column>
              <template #empty>
                <div class="empty-box">لا توجد مستندات لهذه الوحدة بعد</div>
              </template>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <Dialog
      v-model:visible="editImageVisible"
      modal
      header="تعديل ترتيب الصورة"
      :style="{ width: '420px' }"
    >
      <div class="field">
        <label>ترتيب الظهور</label>
        <InputNumber v-model="editSortOrder" :min="0" />
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="editImageVisible = false" />
          <Button label="حفظ التغييرات" :loading="savingMedia" @click="saveImageSort" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="editDocVisible"
      modal
      header="تعديل عنوان المستند"
      :style="{ width: '420px' }"
    >
      <div class="field">
        <label>العنوان</label>
        <InputText v-model="editDocTitle" placeholder="عنوان المستند" />
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="editDocVisible = false" />
          <Button label="حفظ التغييرات" :loading="savingMedia" @click="saveDocTitle" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.page-loading {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--surface) 80%, transparent);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
}

.detail-value {
  font-size: 0.95rem;
  color: var(--text-strong);
}

.media-panel {
  padding-top: 8px;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab-count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand-mid);
  background: var(--brand-soft);
}

.media-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.media-toolbar h3 {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 800;
}

.media-toolbar p {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.media-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.25s var(--ease);
}

.media-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}

.media-thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--brand-soft);
}

.media-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sort-badge {
  position: absolute;
  top: 10px;
  inset-inline-start: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: rgba(6, 40, 48, 0.72);
  padding: 4px 8px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.media-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
}

.media-date {
  font-size: 0.82rem;
  color: var(--muted);
}

.doc-upload-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfcfd, #f4f8f9);
  border: 1px solid var(--border);
}

.doc-title-input {
  flex: 1 1 220px;
  max-width: 320px;
}

.file-name {
  color: var(--muted);
  font-size: 0.86rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--brand-mid);
  font-weight: 700;
}

.file-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

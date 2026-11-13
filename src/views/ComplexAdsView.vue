<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { getComplexes } from '@/api/complexes'
import { createComplexAd, deleteComplexAd, getComplexAds, type ComplexAd } from '@/api/complexAds'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { useConfirmAction } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import type { Complex } from '@/types'

const notify = useNotify()
const { ask } = useConfirmAction()

const complexes = ref<Complex[]>([])
const complexId = ref<string | null>(null)
const items = ref<ComplexAd[]>([])
const loading = ref(false)
const dialog = ref(false)
const saving = ref(false)
const file = ref<File | null>(null)

const complexOptions = computed(() =>
  complexes.value.map((c) => ({
    id: c.id,
    label: c.nameAr || c.name || c.id,
  })),
)

const form = reactive({
  titleAr: '',
  title: '',
  titleKu: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
})

onMounted(async () => {
  try {
    const page = await getComplexes({ Page: 1, PageSize: 200 })
    complexes.value = page.items ?? []
    complexId.value = complexes.value[0]?.id ?? null
    if (complexId.value) await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  }
})

async function load() {
  if (!complexId.value) return
  loading.value = true
  try {
    items.value = await getComplexAds(complexId.value)
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.titleAr = ''
  form.title = ''
  form.titleKu = ''
  form.linkUrl = ''
  form.sortOrder = items.value.length
  form.isActive = true
  file.value = null
  dialog.value = true
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

async function save() {
  if (!complexId.value) {
    notify.warning('اختر المجمع')
    return
  }
  if (!file.value) {
    notify.warning('ارفع صورة الإعلان (يفضّل 1080×540)')
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('complexId', complexId.value)
    fd.append('titleAr', form.titleAr)
    fd.append('title', form.title)
    fd.append('titleKu', form.titleKu)
    fd.append('linkUrl', form.linkUrl)
    fd.append('sortOrder', String(form.sortOrder))
    fd.append('isActive', String(form.isActive))
    fd.append('file', file.value)
    await createComplexAd(fd)
    dialog.value = false
    notify.success('تم إضافة الإعلان')
    await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(row: ComplexAd) {
  if (!(await ask(`حذف إعلان "${row.titleAr || row.title || ''}"؟`))) return
  try {
    await deleteComplexAd(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  }
}

function absUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return path
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="إعلانات تطبيق الساكن"
      subtitle="ارفع صوراً بعرض مناسب للهاتف (يفضّل 1080×540 أو نسبة 2:1) — تظهر ككارد متحرك في الرئيسية"
    >
      <template #actions>
        <Button label="إضافة إعلان" icon="pi pi-plus" :disabled="!complexId" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel toolbar">
      <Select
        v-model="complexId"
        :options="complexOptions"
        option-label="label"
        option-value="id"
        placeholder="المجمع"
        class="complex-select"
        @update:model-value="load"
      />
      <Button label="تحديث" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="load" />
    </div>

    <div class="cards">
      <div v-for="ad in items" :key="ad.id" class="ad-card">
        <img :src="absUrl(ad.imageUrl)" :alt="ad.titleAr || ad.title || 'ad'" class="ad-img" />
        <div class="ad-meta">
          <strong>{{ ad.titleAr || ad.title || ad.titleKu || 'بدون عنوان' }}</strong>
          <span>{{ ad.isActive ? 'نشط' : 'متوقف' }} · ترتيب {{ ad.sortOrder }}</span>
          <div class="ad-actions">
            <Button label="حذف" icon="pi pi-trash" severity="danger" text size="small" @click="remove(ad)" />
          </div>
        </div>
      </div>
      <p v-if="!loading && items.length === 0" class="empty">لا توجد إعلانات لهذا المجمع</p>
    </div>

    <Dialog v-model:visible="dialog" modal header="إعلان جديد" :style="{ width: '480px' }">
      <div class="form">
        <label>العنوان (عربي)</label>
        <InputText v-model="form.titleAr" class="w-full" />
        <label>Title (EN)</label>
        <InputText v-model="form.title" class="w-full" />
        <label>ناونیشان (کوردی)</label>
        <InputText v-model="form.titleKu" class="w-full" />
        <label>رابط اختياري</label>
        <InputText v-model="form.linkUrl" class="w-full" dir="ltr" />
        <label>الترتيب</label>
        <InputNumber v-model="form.sortOrder" class="w-full" />
        <div class="check-row">
          <Checkbox v-model="form.isActive" binary input-id="active" />
          <label for="active">نشط</label>
        </div>
        <label>صورة الإعلان *</label>
        <input type="file" accept="image/*" @change="onFile" />
        <small>المقاس المناسب للهاتف: تقريباً 1080×540 بكسل</small>
      </div>
      <template #footer>
        <Button label="إلغاء" severity="secondary" text @click="dialog = false" />
        <Button label="حفظ" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}
.complex-select {
  min-width: 240px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.ad-card {
  border: 1px solid var(--p-content-border-color, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.ad-img {
  width: 100%;
  aspect-ratio: 2 / 1;
  object-fit: cover;
  display: block;
  background: #f1f5f9;
}
.ad-meta {
  padding: 0.75rem 0.9rem 0.85rem;
  display: grid;
  gap: 0.25rem;
}
.ad-meta span {
  color: #64748b;
  font-size: 0.85rem;
}
.ad-actions {
  margin-top: 0.35rem;
}
.empty {
  grid-column: 1 / -1;
  color: #64748b;
}
.form {
  display: grid;
  gap: 0.45rem;
}
.check-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.35rem 0;
}
.w-full {
  width: 100%;
}
small {
  color: #64748b;
}
</style>

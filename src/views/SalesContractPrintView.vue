<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { downloadSalesContractPdf } from '@/api/salesContracts'
import { getErrorMessage } from '@/api/client'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const pdfUrl = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = String(route.params.id || '')
    if (!id) throw new Error('معرّف العقد غير موجود')

    const blob = await downloadSalesContractPdf(id)
    if (blob.type && blob.type.includes('json')) {
      const text = await blob.text()
      const parsed = JSON.parse(text)
      throw new Error(parsed.message || 'فشل توليد ملف PDF')
    }

    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function printPdf() {
  if (!pdfUrl.value) return
  const w = window.open(pdfUrl.value, '_blank', 'noopener,noreferrer')
  w?.focus()
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'sales-contracts' })
}

onMounted(() => {
  void load()
})

onUnmounted(() => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
})
</script>

<template>
  <div class="print-page">
    <div class="toolbar no-print">
      <div class="toolbar-title">
        <strong>معاينة عقد البيع (PDF)</strong>
        <span>مطابق لقالب المجمع المرفوع</span>
      </div>
      <div class="toolbar-actions">
        <Button label="رجوع" severity="secondary" outlined icon="pi pi-arrow-right" @click="goBack" />
        <Button label="تحديث" severity="secondary" outlined icon="pi pi-refresh" :loading="loading" @click="load" />
        <Button label="فتح / طباعة" icon="pi pi-print" :disabled="loading || !pdfUrl" @click="printPdf" />
      </div>
    </div>

    <div v-if="loading" class="state">جاري توليد عقد PDF...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <iframe v-else-if="pdfUrl" class="pdf-frame" :src="pdfUrl" title="عقد البيع" />
  </div>
</template>

<style scoped>
.print-page {
  min-height: 100vh;
  background: #e8ebe6;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #d5ddd4;
  position: sticky;
  top: 0;
  z-index: 5;
}

.toolbar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toolbar-title strong {
  color: #2f5139;
}

.toolbar-title span {
  color: #6b7c6e;
  font-size: 0.85rem;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.state {
  padding: 48px 20px;
  text-align: center;
  color: #445;
}

.state.error {
  color: #b42318;
}

.pdf-frame {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 70px);
  border: 0;
  background: #cfd6cb;
}
</style>

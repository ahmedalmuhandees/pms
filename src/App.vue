<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useComplexBrandStore } from '@/stores/complexBrand'

const brand = useComplexBrandStore()
brand.apply()
onMounted(() => {
  brand.apply()
  void brand.loadPortal()
})
</script>

<template>
  <Toast position="top-left" />
  <ConfirmDialog />
  <RouterView />
</template>

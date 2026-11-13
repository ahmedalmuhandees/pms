<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useComplexBrandStore } from '@/stores/complexBrand'

const brand = useComplexBrandStore()
onMounted(() => brand.apply())
brand.apply()
</script>

<template>
  <Toast position="top-left" />
  <ConfirmDialog />
  <RouterView />
</template>

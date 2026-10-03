<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from 'chart.js'

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  Tooltip,
)

const props = withDefaults(
  defineProps<{
    type: ChartType
    data: ChartData
    options?: ChartOptions
    height?: number
  }>(),
  { height: 260 },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function buildOptions(): ChartOptions {
  const base: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        rtl: true,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
          font: { family: "'IBM Plex Sans Arabic', sans-serif", size: 12 },
          color: '#5a717a',
        },
      },
      tooltip: {
        rtl: true,
        titleFont: { family: "'IBM Plex Sans Arabic', sans-serif" },
        bodyFont: { family: "'IBM Plex Sans Arabic', sans-serif" },
      },
    },
  }

  if (props.type === 'bar') {
    base.scales = {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'IBM Plex Sans Arabic', sans-serif", size: 11 },
          color: '#5a717a',
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(211, 224, 229, 0.7)' },
        ticks: {
          precision: 0,
          font: { family: "'IBM Plex Sans Arabic', sans-serif", size: 11 },
          color: '#5a717a',
        },
      },
    }
  }

  const extra = props.options || {}
  return {
    ...base,
    ...extra,
    plugins: {
      ...base.plugins,
      ...extra.plugins,
      legend: {
        ...(base.plugins?.legend || {}),
        ...(extra.plugins?.legend || {}),
      },
      tooltip: {
        ...(base.plugins?.tooltip || {}),
        ...(extra.plugins?.tooltip || {}),
      },
    },
  }
}

function render() {
  if (!canvasRef.value) return
  chart?.destroy()
  const config: ChartConfiguration = {
    type: props.type,
    data: props.data,
    options: buildOptions(),
  }
  chart = new Chart(canvasRef.value, config)
}

onMounted(render)

watch(
  () => [props.type, props.data, props.options] as const,
  () => render(),
  { deep: true },
)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="dash-chart" :style="{ height: `${height}px` }">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.dash-chart {
  position: relative;
  width: 100%;
}
</style>

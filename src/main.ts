import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import { arLocale } from './primevue-locale'
import { installStaleChunkReload } from './utils/staleChunkReload'
import './styles/main.css'

installStaleChunkReload()

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e6f3f5',
      100: '#c0dde3',
      200: '#9ecbd3',
      300: '#6aadb8',
      400: '#3a8f9d',
      500: '#156574',
      600: '#0f4c5c',
      700: '#0b3d4a',
      800: '#0a3440',
      900: '#062830',
      950: '#04181e',
    },
    formField: {
      paddingX: '0.95rem',
      paddingY: '0.7rem',
      borderRadius: '12px',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: '0 0 0 3px rgba(21, 101, 116, 0.18)',
      },
    },
  },
  components: {
    select: {
      root: {
        borderRadius: '12px',
        paddingX: '0.95rem',
        paddingY: '0.7rem',
        transitionDuration: '0.2s',
      },
      overlay: {
        borderRadius: '14px',
        shadow: '0 14px 40px rgba(6, 40, 48, 0.14)',
      },
      list: {
        padding: '0.4rem',
        gap: '0.15rem',
      },
      option: {
        borderRadius: '10px',
        padding: '0.65rem 0.8rem',
      },
    },
    button: {
      root: {
        borderRadius: '12px',
        roundedBorderRadius: '999px',
        gap: '0.55rem',
        paddingX: '1.15rem',
        paddingY: '0.7rem',
        iconOnlyWidth: '2.55rem',
        label: {
          fontWeight: '700',
        },
        sm: {
          fontSize: '0.875rem',
          paddingX: '0.9rem',
          paddingY: '0.5rem',
          iconOnlyWidth: '2.15rem',
        },
        lg: {
          fontSize: '1.05rem',
          paddingX: '1.4rem',
          paddingY: '0.85rem',
          iconOnlyWidth: '3rem',
        },
        raisedShadow: '0 8px 20px rgba(11, 61, 74, 0.18)',
        focusRing: {
          width: '2px',
          style: 'solid',
          offset: '1px',
        },
      },
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '#156574',
              hoverBackground: '#0f4c5c',
              activeBackground: '#0b3d4a',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: 'transparent',
                shadow: '0 0 0 3px rgba(21, 101, 116, 0.28)',
              },
            },
            secondary: {
              background: '#eef4f6',
              hoverBackground: '#e2ecef',
              activeBackground: '#d5e3e8',
              borderColor: '#d3e0e5',
              hoverBorderColor: '#b7c9d0',
              activeBorderColor: '#b7c9d0',
              color: '#0b3d4a',
              hoverColor: '#062830',
              activeColor: '#062830',
              focusRing: {
                color: 'transparent',
                shadow: '0 0 0 3px rgba(11, 61, 74, 0.12)',
              },
            },
            danger: {
              background: '#c0392b',
              hoverBackground: '#a93226',
              activeBackground: '#922b21',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: 'transparent',
                shadow: '0 0 0 3px rgba(192, 57, 43, 0.25)',
              },
            },
          },
          outlined: {
            primary: {
              hoverBackground: '#e6f3f5',
              activeBackground: '#c0dde3',
              borderColor: '#9ecbd3',
              color: '#156574',
            },
            secondary: {
              hoverBackground: '#f7fafb',
              activeBackground: '#eef4f6',
              borderColor: '#d3e0e5',
              color: '#5a717a',
            },
            danger: {
              hoverBackground: 'rgba(192, 57, 43, 0.08)',
              activeBackground: 'rgba(192, 57, 43, 0.14)',
              borderColor: 'rgba(192, 57, 43, 0.35)',
              color: '#c0392b',
            },
          },
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  locale: arLocale,
  theme: {
    preset: AppPreset,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.mount('#app')

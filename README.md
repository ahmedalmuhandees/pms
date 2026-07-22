# إدارة المجمعات السكنية

داشبورد Vue 3 (Composition API) متصل بـ Properties Management SaaS API.

## التشغيل

يتطلب Node.js 20+.

```bash
nvm use 20
npm install
npm run dev
```

افتح [http://localhost:5173](http://localhost:5173)

## الإعدادات

ملف `.env`:

```
VITE_API_BASE_URL=https://pmsaas-api.execute-iq.com
```

## التقنيات

- Vue 3 + TypeScript + Vite
- Composition API (`<script setup>`)
- Pinia + Vue Router
- Axios
- PrimeVue 4 (MIT) + Aura theme (عربي RTL)

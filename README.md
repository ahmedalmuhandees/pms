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

- محلي (`npm run dev`) → `.env.development`  
  `VITE_API_PROXY_TARGET=https://apicomplex.solidcode-iq.com`
- إنتاج (`npm run build`) → `.env.production`  
  `VITE_API_BASE_URL=https://apicomplex.solidcode-iq.com`

## النشر على سيرفر (SSH / Nginx)

```bash
npm run build
rsync -avz --delete dist/ user@SERVER_IP:/var/www/html/
```

إذا ظهر خطأ MIME `text/html` على ملفات `.js` فالسبب أن Nginx يُرجع `index.html` بدل الملف المفقود. استخدم إعداد `deploy/nginx.conf` ثم:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

امسح كاش المتصفح بعد أول نشر.

## التقنيات

- Vue 3 + TypeScript + Vite
- Composition API (`<script setup>`)
- Pinia + Vue Router
- Axios
- PrimeVue 4 (MIT) + Aura theme (عربي RTL)

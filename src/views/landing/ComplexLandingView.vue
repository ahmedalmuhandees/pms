<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { complexLocation } from '@/router'

const router = useRouter()
const scrolled = ref(false)
const revealEls = ref<HTMLElement[]>([])

const year = new Date().getFullYear()
const companyUrl = 'https://solidcode-iq.com'
const companyName = 'Solid Code IQ'
const companyTagAr = 'حلول ذكية. أثر حقيقي.'
const companyTagEn = 'Smart Solutions. Real Impact.'
const companyEmail = 'hello@solidcodeiq.com'
const companyPhone = '+964 780 000 0000'
const companyCity = 'بغداد، العراق'

const pillars = [
  {
    title: 'الهيكل العقاري',
    text: 'من المجمع إلى البلوك والمبنى والطابق والوحدة — خريطة حية وهيكل عمودي أو أفقي.',
    items: ['المجمعات والمدراء', 'البلوكات والمباني والطوابق', 'الوحدات والحالات', 'خريطة المجمع التفاعلية'],
  },
  {
    title: 'المبيعات والمالية',
    text: 'من الحجز حتى العقد والأقساط والوصولات — تسعير يدوي أو من خطط الأسعار.',
    items: ['خطط الأسعار', 'الحجوزات وعقود البيع', 'الأقساط والتحصيل', 'تصاميم العقود والبنود'],
  },
  {
    title: 'التشغيل والسكان',
    text: 'عملاء وموظفون وسكان وفنيون وزوار ومركبات في دورة تشغيل واحدة واضحة.',
    items: ['العملاء والموظفون', 'عقود الساكنين', 'الزوار والمركبات', 'بوابة الساكن'],
  },
  {
    title: 'الخدمات والمرافق',
    text: 'كهرباء وغاز ومياه وخدمات شهرية ومصاريف — فوترة وتقارير لكل خدمة.',
    items: ['فواتير الكهرباء والغاز والمياه', 'الخدمات الشهرية', 'المصاريف وتقاريرها', 'التقارير العامة وسجل الحركات'],
  },
]

const modules = [
  { icon: 'pi pi-building', title: 'المجمعات والمدراء', desc: 'إدارة متعددة المجمعات مع مدراء وصلاحيات صفحات.' },
  { icon: 'pi pi-sitemap', title: 'هيكل عمودي / أفقي', desc: 'بناء الهيكل بصرياً ثم ربطه بالبلوكات والمباني والوحدات.' },
  { icon: 'pi pi-map', title: 'خريطة المجمع', desc: 'عرض تفاعلي لحالة الوحدات والمباني داخل المجمع.' },
  { icon: 'pi pi-key', title: 'الوحدات', desc: 'متابعة المتاح والمحجوز والمباع والمؤجر والصيانة.' },
  { icon: 'pi pi-tag', title: 'خطط الأسعار', desc: 'تسعير رقمي أو نسبي مع جدول أقساط حسب الموقع والوحدات.' },
  { icon: 'pi pi-file', title: 'عقود المبيعات', desc: 'عقود بيع مع تسعير يدوي أو من النظام وطباعة احترافية.' },
  { icon: 'pi pi-list', title: 'الأقساط والتحصيل', desc: 'متابعة الاستحقاق والدفع الجزئي والمتأخر والوصولات.' },
  { icon: 'pi pi-users', title: 'العملاء والسكان', desc: 'ملفات العملاء وعقود الساكنين وبوابة مقيم.' },
  { icon: 'pi pi-bolt', title: 'المرافق', desc: 'كهرباء وغاز ومياه مع تسعير وفواتير وتقارير.' },
  { icon: 'pi pi-wallet', title: 'المصاريف', desc: 'تسجيل المصاريف التشغيلية مع تقارير واضحة.' },
  { icon: 'pi pi-chart-bar', title: 'لوحة التحكم', desc: 'مؤشرات الوحدات والعقود والأقساط والحركة اليومية.' },
  { icon: 'pi pi-bell', title: 'التنبيهات وواتساب', desc: 'إعدادات الإشعارات ورسائل واتساب للعملاء.' },
]

const steps = [
  { n: '01', title: 'أنشئ المجمع والهيكل', text: 'أضف المجمع ثم البلوكات والمباني والطوابق والوحدات، أو ابنِ الهيكل من أداة البناء.' },
  { n: '02', title: 'سعّر وبع', text: 'أنشئ خطط أسعار، احجز الوحدات، وأصدر عقود البيع مع الأقساط والطباعة.' },
  { n: '03', title: 'شغّل وحصّل', text: 'تابع الساكنين والخدمات والمرافق والمصاريف والتحصيل من لوحة واحدة.' },
]

function onScroll() {
  scrolled.value = window.scrollY > 20
}

function goLogin() {
  // من الدومين الرئيسي (بدون مجمع في المسار) → بوابة مجمع افتراضية
  if (!complexLocation.slug) {
    window.location.assign('/zhsc/login')
    return
  }
  void router.push('/login')
}

function goResident() {
  if (!complexLocation.slug) {
    window.location.assign('/zhsc/resident-login')
    return
  }
  void router.push('/resident-login')
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('is-in')
      }
    },
    { threshold: 0.14 },
  )
  revealEls.value = Array.from(document.querySelectorAll('.reveal'))
  revealEls.value.forEach((el) => observer?.observe(el))
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="lp" dir="rtl">
    <header class="nav" :class="{ scrolled }">
      <a class="nav__brand" :href="companyUrl" target="_blank" rel="noopener noreferrer">
        <img class="mark" src="/landing/brand/favicon.svg" width="42" height="42" alt="" />
        <span class="nav__brand-text">
          <strong>{{ companyName }}</strong>
          <small>{{ companyTagAr }}</small>
        </span>
      </a>
      <nav class="nav__links" aria-label="أقسام الصفحة">
        <button type="button" @click="scrollTo('modules')">المميزات</button>
        <button type="button" @click="scrollTo('pillars')">الأقسام</button>
        <button type="button" @click="scrollTo('flow')">كيف يعمل</button>
      </nav>
      <div class="nav__actions">
        <button type="button" class="btn ghost" @click="goResident">دخول الساكن</button>
        <button type="button" class="btn solid" @click="goLogin">دخول الإدارة</button>
      </div>
    </header>

    <section class="hero">
      <div class="hero__media" aria-hidden="true">
        <img src="/landing/hero.jpg" alt="" class="hero__img" />
        <div class="hero__shade" />
      </div>
      <div class="hero__content">
        <p class="eyebrow">
          <img src="/landing/brand/logo-mark.svg" alt="" width="18" height="22" />
          <span>{{ companyTagEn }}</span>
        </p>
        <p class="brand">إدارة المجمعات السكنية</p>
        <h1>نظام واحد يدير المجمع من البيع حتى التشغيل</h1>
        <p class="lead">
          وحدات، عقود، أقساط، سكان، مرافق، وتقارير — منصة من {{ companyName }} لإدارة المجمعات السكنية بكفاءة.
        </p>
        <div class="cta">
          <button type="button" class="btn solid lg" @click="goLogin">ابدأ من لوحة التحكم</button>
          <button type="button" class="btn ghost lg" @click="scrollTo('modules')">استعرض المميزات</button>
        </div>
      </div>
    </section>

    <section id="pillars" class="section pillars">
      <div class="section__head reveal">
        <h2>أربعة محاور تغطي دورة المجمع كاملة</h2>
        <p>كل قسم في النظام مبني حول عمل يومي واضح للإدارة والمبيعات والتشغيل.</p>
      </div>
      <div class="pillar-grid">
        <article v-for="(p, i) in pillars" :key="p.title" class="pillar reveal" :style="{ '--d': `${i * 80}ms` }">
          <h3>{{ p.title }}</h3>
          <p>{{ p.text }}</p>
          <ul>
            <li v-for="item in p.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="band">
      <div class="band__media" aria-hidden="true">
        <img src="/landing/units.jpg" alt="" />
        <div class="band__shade" />
      </div>
      <div class="band__copy reveal">
        <h2>الوحدات تحت السيطرة</h2>
        <p>
          تابع حالة كل وحدة: متاح، محجوز، مباع، مؤجر، أو صيانة — واربطها بالعقد والخطة والتسعير دون تشتت بين الجداول.
        </p>
      </div>
    </section>

    <section id="modules" class="section modules">
      <div class="section__head reveal">
        <h2>مميزات النظام</h2>
        <p>كل ما تحتاجه لإدارة مجمع سكني حديث في واجهة واحدة.</p>
      </div>
      <div class="module-grid">
        <article v-for="(m, i) in modules" :key="m.title" class="module reveal" :style="{ '--d': `${(i % 4) * 60}ms` }">
          <i :class="m.icon" aria-hidden="true" />
          <h3>{{ m.title }}</h3>
          <p>{{ m.desc }}</p>
        </article>
      </div>
    </section>

    <section class="split">
      <div class="split__copy reveal">
        <h2>تشغيل يومي للسكان والخدمات</h2>
        <p>
          من عقود الساكنين والزوار والمركبات إلى فواتير الكهرباء والغاز والمياه والخدمات الشهرية — التشغيل المالي والتشغيلي في مكان واحد.
        </p>
        <ul class="ticks">
          <li>بوابة الساكن لتسهيل التواصل والمتابعة</li>
          <li>فنيون ومصاريف وتقارير عامة</li>
          <li>تنبيهات وواتساب للعملاء</li>
        </ul>
      </div>
      <div class="split__media reveal" aria-hidden="true">
        <img src="/landing/community.jpg" alt="" />
      </div>
    </section>

    <section id="flow" class="section flow">
      <div class="section__head reveal">
        <h2>ثلاث خطوات للانطلاق</h2>
        <p>ابدأ سريعاً دون تعقيد، ثم توسّع مع نمو المجمع.</p>
      </div>
      <div class="flow-row">
        <article v-for="(s, i) in steps" :key="s.n" class="step reveal" :style="{ '--d': `${i * 90}ms` }">
          <span class="step__n">{{ s.n }}</span>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </article>
      </div>
    </section>

    <section class="finale">
      <div class="finale__media" aria-hidden="true">
        <img src="/landing/ops.jpg" alt="" />
        <div class="finale__shade" />
      </div>
      <div class="finale__copy reveal">
        <p class="brand">إدارة المجمعات السكنية</p>
        <h2>جاهز لإدارة مجمعك بوضوح أكبر</h2>
        <p>ادخل كلوحة إدارة أو كساكن — نفس المنظومة، أدوار مختلفة. منتج من {{ companyName }}.</p>
        <div class="cta">
          <button type="button" class="btn solid lg" @click="goLogin">دخول الإدارة</button>
          <button type="button" class="btn ghost lg" @click="goResident">دخول الساكن</button>
        </div>
      </div>
    </section>

    <footer class="foot">
      <div class="foot__brand">
        <a class="nav__brand" :href="companyUrl" target="_blank" rel="noopener noreferrer">
          <img class="mark sm" src="/landing/brand/favicon.svg" width="34" height="34" alt="" />
          <span class="nav__brand-text">
            <strong>{{ companyName }}</strong>
            <small>{{ companyTagAr }}</small>
          </span>
        </a>
        <p class="foot__about">
          شركة متخصصة في تطوير البرمجيات والحلول التقنية والتحول الرقمي —
          نبني أنظمة وتطبيقات قابلة للتوسع لقطاعات متعددة.
        </p>
      </div>

      <div class="foot__cols">
        <div class="foot__col">
          <h4>المنتج</h4>
          <p>إدارة المجمعات السكنية — هيكل، مبيعات، تشغيل، مرافق</p>
        </div>
        <div class="foot__col">
          <h4>الشركة</h4>
          <a :href="companyUrl" target="_blank" rel="noopener noreferrer">{{ companyUrl.replace('https://', '') }}</a>
          <a :href="`mailto:${companyEmail}`">{{ companyEmail }}</a>
          <a :href="`tel:${companyPhone.replace(/\s/g, '')}`" dir="ltr">{{ companyPhone }}</a>
          <span>{{ companyCity }}</span>
        </div>
      </div>

      <div class="foot__bottom">
        <span dir="ltr">© {{ year }} {{ companyName }}. جميع الحقوق محفوظة.</span>
        <a class="foot__site" :href="companyUrl" target="_blank" rel="noopener noreferrer">
          زيارة موقع الشركة
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.lp {
  /* Solid Code IQ brand */
  --ink: #0b1f44;
  --blue: #3d7ef5;
  --blue-deep: #2563eb;
  --accent: #e8808d;
  --cream: #f4f7fc;
  --surface: #ffffff;
  --muted: rgba(244, 247, 252, 0.82);
  --line: rgba(11, 31, 68, 0.12);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  color: var(--ink);
  background: var(--cream);
  font-family: 'IBM Plex Sans Arabic', 'Cairo', sans-serif;
  min-height: 100vh;
  overflow-x: clip;
}

.lp :is(h1, h2, h3, h4, .brand, .nav__brand strong, .step__n) {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
}

.nav {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px clamp(18px, 4vw, 48px);
  transition:
    background 0.35s var(--ease),
    backdrop-filter 0.35s var(--ease),
    box-shadow 0.35s var(--ease);
}

.nav.scrolled {
  background: rgba(244, 247, 252, 0.94);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(11, 31, 68, 0.1);
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.nav__brand-text {
  display: grid;
  gap: 2px;
}

.nav__brand-text small {
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.75;
}

.mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: block;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgba(61, 126, 245, 0.25);
}

.mark.sm {
  width: 34px;
  height: 34px;
}

.nav__brand strong {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--ink);
}

.nav.scrolled .nav__brand strong,
.nav.scrolled .nav__brand-text small {
  color: var(--ink);
}

.nav:not(.scrolled) .nav__brand strong,
.nav:not(.scrolled) .nav__brand-text small,
.nav:not(.scrolled) .nav__links button {
  color: #f4f7fc;
}

.nav__links {
  display: flex;
  gap: 8px;
}

.nav__links button,
.nav__actions {
  display: flex;
  gap: 8px;
}

.nav__links button {
  border: 0;
  background: transparent;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 999px;
}

.btn {
  border: 0;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  border-radius: 999px;
  padding: 0.65rem 1.15rem;
  transition:
    transform 0.25s var(--ease),
    background 0.25s var(--ease),
    color 0.25s var(--ease),
    border-color 0.25s var(--ease);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.solid {
  background: linear-gradient(145deg, var(--blue), var(--blue-deep));
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
}

.nav:not(.scrolled) .btn.ghost {
  color: #f4f7fc;
  border-color: rgba(244, 247, 252, 0.4);
}

.btn.lg {
  padding: 0.9rem 1.45rem;
  font-size: 1rem;
}

.hero {
  position: relative;
  min-height: 100vh;
  display: grid;
  align-items: center;
  padding: clamp(110px, 14vh, 150px) clamp(18px, 5vw, 64px) clamp(48px, 8vh, 80px);
  color: #f4f7fc;
}

.hero__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.06);
  animation: ken 18s ease-in-out infinite alternate;
}

.hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, rgba(11, 31, 68, 0.92) 0%, rgba(11, 31, 68, 0.72) 42%, rgba(37, 99, 235, 0.35) 100%),
    linear-gradient(180deg, rgba(11, 31, 68, 0.55) 0%, transparent 38%, rgba(11, 31, 68, 0.7) 100%);
}

.hero__content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  animation: rise 0.9s var(--ease) both;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(61, 126, 245, 0.45);
  background: rgba(11, 31, 68, 0.35);
  color: rgba(244, 247, 252, 0.88);
  font-size: 0.85rem;
  font-weight: 600;
}

.eyebrow img {
  display: block;
  filter: drop-shadow(0 0 6px rgba(61, 126, 245, 0.55));
}

.brand {
  margin: 0 0 12px;
  font-size: clamp(1.35rem, 3.2vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #fff;
}

.hero h1,
.finale h2,
.section__head h2,
.band__copy h2,
.split__copy h2 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.hero h1 {
  font-size: clamp(1.8rem, 4.4vw, 3.1rem);
  max-width: 14ch;
  color: #fff;
}

.lead {
  margin: 14px 0 0;
  font-size: 1.08rem;
  line-height: 1.75;
  color: rgba(244, 247, 252, 0.9);
  max-width: 42ch;
}

.section__head p,
.band__copy p,
.split__copy p,
.finale__copy > p:not(.brand) {
  margin: 14px 0 0;
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--muted);
}

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.section {
  padding: clamp(64px, 10vh, 110px) clamp(18px, 5vw, 64px);
}

.section__head {
  max-width: 640px;
  margin-bottom: clamp(28px, 5vh, 48px);
}

.section__head h2 {
  font-size: clamp(1.55rem, 3vw, 2.2rem);
  color: var(--ink);
}

.section__head p {
  color: rgba(11, 31, 68, 0.68);
}

.pillar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.pillar {
  padding-top: 18px;
  border-top: 2px solid var(--blue);
}

.pillar h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.pillar p {
  margin: 10px 0 16px;
  color: rgba(11, 31, 68, 0.7);
  line-height: 1.7;
}

.pillar ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.pillar li {
  position: relative;
  padding-inline-start: 14px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--blue-deep);
}

.pillar li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.55em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--blue);
}

.band,
.finale {
  position: relative;
  min-height: 58vh;
  display: grid;
  align-items: center;
  padding: clamp(48px, 8vh, 90px) clamp(18px, 5vw, 64px);
  color: #f4f7fc;
  overflow: hidden;
}

.band__media,
.finale__media {
  position: absolute;
  inset: 0;
}

.band__media img,
.finale__media img,
.split__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.band__shade,
.finale__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(11, 31, 68, 0.88), rgba(37, 99, 235, 0.35) 78%);
}

.band__copy,
.finale__copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.band__copy h2,
.finale__copy h2,
.split__copy h2 {
  font-size: clamp(1.6rem, 3.2vw, 2.4rem);
  color: #fff;
}

.modules {
  background: var(--surface);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px 22px;
}

.module i {
  font-size: 1.25rem;
  color: var(--blue);
}

.module h3 {
  margin: 12px 0 8px;
  font-size: 1.05rem;
  font-weight: 800;
}

.module p {
  margin: 0;
  color: rgba(11, 31, 68, 0.68);
  line-height: 1.65;
  font-size: 0.92rem;
}

.split {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 0;
  min-height: 62vh;
  background: var(--ink);
  color: #f4f7fc;
}

.split__copy {
  padding: clamp(48px, 8vh, 90px) clamp(18px, 5vw, 64px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.split__copy h2 {
  font-size: clamp(1.55rem, 3vw, 2.25rem);
}

.split__copy p {
  color: rgba(244, 247, 252, 0.78);
}

.ticks {
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.ticks li {
  font-weight: 700;
  padding-inline-start: 18px;
  position: relative;
}

.ticks li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.55em;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--blue);
}

.split__media {
  min-height: 360px;
}

.flow-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
}

.step__n {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: var(--blue);
  margin-bottom: 10px;
}

.step h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.step p {
  margin: 10px 0 0;
  color: rgba(11, 31, 68, 0.68);
  line-height: 1.7;
}

.finale .brand {
  color: #fff;
}

.foot {
  display: grid;
  gap: 28px;
  padding: 36px clamp(18px, 5vw, 64px) 24px;
  background: #07152e;
  color: rgba(244, 247, 252, 0.78);
  font-size: 0.9rem;
}

.foot__brand {
  display: grid;
  gap: 12px;
  max-width: 520px;
}

.foot__about {
  margin: 0;
  line-height: 1.7;
  color: rgba(244, 247, 252, 0.68);
}

.foot .nav__brand strong,
.foot .nav__brand-text small {
  color: #f4f7fc;
}

.foot__cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.foot__col {
  display: grid;
  gap: 8px;
  align-content: start;
}

.foot__col h4 {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
}

.foot__col a,
.foot__col span,
.foot__col p {
  margin: 0;
  color: rgba(244, 247, 252, 0.72);
  text-decoration: none;
  line-height: 1.6;
}

.foot__col a:hover {
  color: var(--blue);
}

.foot__bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(61, 126, 245, 0.22);
  font-size: 0.84rem;
}

.foot__site {
  color: var(--blue);
  font-weight: 700;
  text-decoration: none;
}

.foot__site:hover {
  text-decoration: underline;
}

.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition:
    opacity 0.7s var(--ease),
    transform 0.7s var(--ease);
  transition-delay: var(--d, 0ms);
}

.reveal.is-in {
  opacity: 1;
  transform: none;
}

@keyframes ken {
  from {
    transform: scale(1.06) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(-1.5%, 1%, 0);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 1100px) {
  .pillar-grid,
  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .split,
  .flow-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .nav__links {
    display: none;
  }

  .hero h1 {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .pillar-grid,
  .module-grid,
  .flow-row,
  .foot__cols {
    grid-template-columns: 1fr;
  }

  .nav__actions .ghost {
    display: none;
  }
}
</style>

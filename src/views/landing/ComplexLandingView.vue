<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const scrolled = ref(false)
const revealEls = ref<HTMLElement[]>([])

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
  void router.push('/login')
}

function goResident() {
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
      <div class="nav__brand">
        <span class="mark">مج</span>
        <strong>إدارة المجمعات السكنية</strong>
      </div>
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
        <p class="brand">إدارة المجمعات السكنية</p>
        <h1>نظام واحد يدير المجمع من البيع حتى التشغيل</h1>
        <p class="lead">
          وحدات، عقود، أقساط، سكان، مرافق، وتقارير — منصة عربية لإدارة المجمعات السكنية بكفاءة.
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
        <p>ادخل كلوحة إدارة أو كساكن — نفس المنظومة، أدوار مختلفة.</p>
        <div class="cta">
          <button type="button" class="btn solid lg" @click="goLogin">دخول الإدارة</button>
          <button type="button" class="btn ghost lg" @click="goResident">دخول الساكن</button>
        </div>
      </div>
    </section>

    <footer class="foot">
      <div class="nav__brand">
        <span class="mark sm">مج</span>
        <strong>إدارة المجمعات السكنية</strong>
      </div>
      <span>منصة إدارة مجمعات سكنية — هيكل، مبيعات، تشغيل، مرافق</span>
    </footer>
  </div>
</template>

<style scoped>
.lp {
  --ink: #0a2f38;
  --teal: #156574;
  --teal-deep: #0b3d4a;
  --sand: #d7e4e7;
  --cream: #f2f6f7;
  --muted: rgba(242, 246, 247, 0.8);
  --line: rgba(10, 47, 56, 0.12);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  color: var(--ink);
  background: var(--cream);
  font-family: 'IBM Plex Sans Arabic', 'Cairo', sans-serif;
  min-height: 100vh;
  overflow-x: clip;
}

.lp :is(h1, h2, h3, .brand, .nav__brand strong, .step__n) {
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
  background: rgba(247, 244, 239, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px rgba(10, 47, 56, 0.08);
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #1f8494, var(--teal-deep));
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.mark.sm {
  width: 34px;
  height: 34px;
  font-size: 0.85rem;
}

.nav__brand strong {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--ink);
}

.nav.scrolled .nav__brand strong {
  color: var(--ink);
}

.nav:not(.scrolled) .nav__brand strong,
.nav:not(.scrolled) .nav__links button {
  color: #f7f4ef;
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
  background: linear-gradient(145deg, #1f8494, var(--teal-deep));
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
}

.nav:not(.scrolled) .btn.ghost {
  color: #f7f4ef;
  border-color: rgba(247, 244, 239, 0.45);
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
  color: #f7f4ef;
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
    linear-gradient(105deg, rgba(6, 28, 34, 0.88) 0%, rgba(6, 28, 34, 0.62) 42%, rgba(6, 28, 34, 0.28) 100%),
    linear-gradient(180deg, rgba(6, 28, 34, 0.45) 0%, transparent 38%, rgba(6, 28, 34, 0.55) 100%);
}

.hero__content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  animation: rise 0.9s var(--ease) both;
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
  color: rgba(247, 244, 239, 0.9);
  max-width: 38ch;
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
  color: rgba(10, 47, 56, 0.68);
}

.pillar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.pillar {
  padding-top: 18px;
  border-top: 2px solid var(--teal);
}

.pillar h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.pillar p {
  margin: 10px 0 16px;
  color: rgba(10, 47, 56, 0.7);
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
  color: var(--teal-deep);
}

.pillar li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.55em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--teal);
}

.band,
.finale {
  position: relative;
  min-height: 58vh;
  display: grid;
  align-items: center;
  padding: clamp(48px, 8vh, 90px) clamp(18px, 5vw, 64px);
  color: #f7f4ef;
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
  background: linear-gradient(90deg, rgba(8, 32, 38, 0.82), rgba(8, 32, 38, 0.35) 70%);
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
  background: #fff;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px 22px;
}

.module i {
  font-size: 1.25rem;
  color: var(--teal);
}

.module h3 {
  margin: 12px 0 8px;
  font-size: 1.05rem;
  font-weight: 800;
}

.module p {
  margin: 0;
  color: rgba(10, 47, 56, 0.68);
  line-height: 1.65;
  font-size: 0.92rem;
}

.split {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 0;
  min-height: 62vh;
  background: var(--ink);
  color: #f7f4ef;
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
  color: rgba(247, 244, 239, 0.78);
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
  background: #c46b2b;
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
  color: var(--teal);
  margin-bottom: 10px;
}

.step h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.step p {
  margin: 10px 0 0;
  color: rgba(10, 47, 56, 0.68);
  line-height: 1.7;
}

.finale .brand {
  color: #fff;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding: 28px clamp(18px, 5vw, 64px);
  background: #062830;
  color: rgba(247, 244, 239, 0.72);
  font-size: 0.88rem;
}

.foot .nav__brand strong {
  color: #f7f4ef;
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
  .flow-row {
    grid-template-columns: 1fr;
  }

  .nav__actions .ghost {
    display: none;
  }
}
</style>

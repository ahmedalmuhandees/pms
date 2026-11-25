import type { ServiceBill } from '@/types'
import { MeterReadingSource, PaymentMethod, ServiceBillingMode, ServiceTypeName } from '@/types'
import { openReceiptPrintWindow } from '@/utils/receiptPrintLayout'

const months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const paymentNames: Record<number, string> = {
  [PaymentMethod.Cash]: 'كاش',
  [PaymentMethod.Bank]: 'بنك',
  [PaymentMethod.Transfer]: 'تحويل',
  [PaymentMethod.Cheque]: 'شيك',
  [PaymentMethod.Card]: 'ماستر',
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function money(v: number | null | undefined) {
  return Number(v || 0).toLocaleString('en-US')
}

function netOf(b: ServiceBill) {
  return Math.max(0, Number(b.amount || 0) - Number(b.discount || 0))
}

function periodLabel(b: ServiceBill) {
  return `${months[(b.month || 1) - 1] || b.month} ${b.year}`
}

function paymentLabel(b: ServiceBill) {
  if (!b.paid) return '—'
  if (b.paymentMethod == null) return '—'
  return paymentNames[b.paymentMethod] || String(b.paymentMethod)
}

function serviceClass(b: ServiceBill) {
  const name = b.serviceTypeName
  if (name === ServiceTypeName.Electricity) return 't-electricity'
  if (name === ServiceTypeName.Water) return 't-water'
  if (name === ServiceTypeName.Gas) return 't-gas'
  const label = (b.serviceDisplayName || '').toLowerCase()
  if (label.includes('كهرب')) return 't-electricity'
  if (label.includes('ماء') || label.includes('مياه')) return 't-water'
  if (label.includes('غاز')) return 't-gas'
  return 't-services'
}

function hasReading(b: ServiceBill) {
  return Number(b.billingMode) === ServiceBillingMode.Metered
}

function readingSourceLabel(source?: number | null) {
  if (source === MeterReadingSource.Api) return 'عداد رقمي'
  if (source === MeterReadingSource.Manual) return 'قراءة يدوية'
  return '—'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return escapeHtml(String(value).slice(0, 10))
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${yyyy}-${mm}-${dd}`
}

function invoiceNumberOf(rows: ServiceBill[]) {
  const first = rows[0]
  if (!first) return '—'
  return `INV-${first.year}-${String(first.month).padStart(2, '0')}-${first.id.slice(0, 8).toUpperCase()}`
}

export interface ServiceInvoicePrintOptions {
  rows: ServiceBill[]
  logoUrl?: string | null
  currency?: string
  copyLabels?: string[]
  note?: string | null
}

export function buildServiceInvoiceHtml(options: ServiceInvoicePrintOptions): string {
  const rows = options.rows
  const currency = options.currency || 'د.ع'
  const copyLabels = options.copyLabels?.length ? options.copyLabels : ['نسخة الساكن', 'نسخة الإدارة']
  const logo = options.logoUrl
    ? escapeHtml(
        options.logoUrl.startsWith('http') || options.logoUrl.startsWith('data:')
          ? options.logoUrl
          : `${window.location.origin}${options.logoUrl.startsWith('/') ? '' : '/'}${options.logoUrl}`,
      )
    : ''

  const total = rows.reduce((s, b) => s + netOf(b), 0)
  const allPaid = rows.length > 0 && rows.every((b) => b.paid)
  const residentName = rows[0]?.residentName || '—'
  const unitNumber = rows[0]?.unitNumber || '—'
  const dueDate = rows[0]?.dueDate ? formatDate(rows[0].dueDate) : '—'
  const paymentDate = rows.find((b) => b.paidAt)?.paidAt
    ? formatDate(rows.find((b) => b.paidAt)?.paidAt)
    : '—'
  const issueDate = formatDate(rows[0]?.paidAt || rows[0]?.createdAt || new Date().toISOString())
  const invNo = invoiceNumberOf(rows)
  const note = escapeHtml(options.note || 'نشكركم على التزامكم بسداد الخدمات في موعدها.')
  const metered = rows.filter(hasReading)

  const itemRows = rows
    .map(
      (it) => `<tr>
        <td class="service"><i class="dot ${serviceClass(it)}"></i>${escapeHtml(it.serviceDisplayName || '—')}</td>
        <td>${escapeHtml(it.residentName || residentName)}</td>
        <td class="num">${escapeHtml(it.unitNumber || unitNumber)}</td>
        <td>${escapeHtml(periodLabel(it))}</td>
        <td class="num">${money(it.amount)}</td>
        <td class="num">${money(it.discount)}</td>
        <td class="num strong">${money(netOf(it))}</td>
        <td><span class="badge ${it.paid ? 'paid' : 'unpaid'}">${it.paid ? 'مسدد' : 'غير مسدد'}</span></td>
        <td>${escapeHtml(paymentLabel(it))}</td>
      </tr>`,
    )
    .join('')

  const emptyRow = rows.length
    ? ''
    : `<tr><td colspan="9" class="empty">لا توجد بنود في هذه الفاتورة.</td></tr>`

  const readingsSection = metered.length
    ? `<section class="block">
        <h2>قراءات العدادات والاستهلاك</h2>
        <table class="readings">
          <thead>
            <tr>
              <th>الخدمة</th><th>مصدر القراءة</th><th>وضع الفوترة</th>
              <th>القراءة السابقة</th><th>القراءة الحالية</th><th>الاستهلاك</th>
            </tr>
          </thead>
          <tbody>
            ${metered
              .map(
                (it) => `<tr>
              <td class="service"><i class="dot ${serviceClass(it)}"></i>${escapeHtml(it.serviceDisplayName || '—')}</td>
              <td>${escapeHtml(readingSourceLabel(it.readingSource))}</td>
              <td>${Number(it.billingMode) === ServiceBillingMode.Metered ? 'حسب الاستهلاك' : 'ثابت'}</td>
              <td class="num">${money(it.previousReading)}</td>
              <td class="num">${money(it.reading)}</td>
              <td class="num strong">${money(it.consumption)} <small>${escapeHtml(it.unitOfMeasure || '')}</small></td>
            </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </section>`
    : ''

  const articles = copyLabels
    .map(
      (copy, c) => `
      <article class="invoice">
        <div class="strip" aria-hidden="true">
          <span class="s-blue"></span><span class="s-orange"></span><span class="s-lime"></span>
        </div>
        <header class="head">
          ${logo ? `<img src="${logo}" alt="شعار المجمع" class="logo" />` : `<div class="logo-spacer"></div>`}
          <div class="head-title">
            <h1>فاتورة الخدمات</h1>
            <span class="copy-tag">${escapeHtml(copy)}</span>
          </div>
          <dl class="head-meta">
            <div><dt>رقم الفاتورة</dt><dd class="num">${escapeHtml(invNo)}</dd></div>
            <div><dt>تاريخ الإصدار</dt><dd class="num">${issueDate}</dd></div>
            <div><dt>تاريخ الاستحقاق</dt><dd class="num">${dueDate}</dd></div>
            <div><dt>تاريخ الدفع</dt><dd class="num">${paymentDate}</dd></div>
          </dl>
        </header>
        <section class="resident">
          <div><span class="lbl">الساكن</span><strong>${escapeHtml(residentName)}</strong></div>
          <div><span class="lbl">الوحدة</span><strong class="num">${escapeHtml(unitNumber)}</strong></div>
          <div>
            <span class="lbl">حالة الفاتورة</span>
            <span class="badge ${allPaid ? 'paid' : 'unpaid'}">${allPaid ? 'مسدد' : 'غير مسدد'}</span>
          </div>
        </section>
        <section class="block">
          <table>
            <thead>
              <tr>
                <th>الخدمة</th><th>الساكن</th><th>الوحدة</th><th>الفترة</th>
                <th>المبلغ</th><th>الخصم</th><th>الصافي</th><th>الحالة</th><th>السداد</th>
              </tr>
            </thead>
            <tbody>${itemRows || emptyRow}</tbody>
            <tfoot>
              <tr>
                <td colspan="6">الإجمالي</td>
                <td class="num total">${money(total)}</td>
                <td colspan="2" class="cur">${escapeHtml(currency)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
        ${readingsSection}
        <footer class="foot">
          <p>${note}</p>
          <div class="sign"><span>التوقيع / الختم</span></div>
        </footer>
      </article>
      ${c < copyLabels.length - 1 ? `<div class="cut" aria-hidden="true"><span>✂</span></div>` : ''}`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>فاتورة الخدمات</title>
<style>
  :root {
    --blue: #1fa3dc;
    --orange: #f7941d;
    --lime: #c3d62c;
    --ink: #1f2a37;
    --muted: #6b7686;
    --line: #e3e8ee;
    --ok: #1f8a4c;
    --ok-bg: #e4f5ec;
    --bad: #c2410c;
    --bad-bg: #fdeadd;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; background: #fff; color: var(--ink);
    font-family: 'Segoe UI', Tahoma, 'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif;
    line-height: 1.45;
  }
  .no-print {
    display: flex; gap: 8px; justify-content: center;
    padding: 10px; background: #f3f6f8; border-bottom: 1px solid #ccd;
  }
  .no-print button {
    border: 0; background: var(--blue); color: #fff; font-weight: 700;
    padding: 8px 18px; border-radius: 6px; cursor: pointer; font: inherit;
  }
  .sheet {
    width: 8.5in; height: 11in; margin: 0 auto; padding: 0.25in;
    background: #fff; display: flex; flex-direction: column; overflow: hidden;
  }
  .invoice {
    flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;
    border: 1px solid var(--line); border-radius: 4px; overflow: hidden; font-size: 10.5px;
  }
  .cut {
    flex: 0 0 0.2in; display: flex; align-items: center;
    border-top: 1px dashed #9aa5b1; margin-top: 0.1in; height: 0; position: relative;
  }
  .cut span {
    position: absolute; top: -9px; right: 12px; background: #fff;
    padding: 0 4px; color: #9aa5b1; font-size: 12px;
  }
  .strip { display: flex; height: 5px; flex: none; }
  .strip span { flex: 1; }
  .s-blue { background: var(--blue); }
  .s-orange { background: var(--orange); }
  .s-lime { background: var(--lime); }
  .head {
    display: grid; grid-template-columns: auto 1fr auto;
    align-items: center; gap: 14px; padding: 8px 16px 4px;
  }
  .logo { width: 0.95in; height: auto; display: block; }
  .logo-spacer { width: 0.95in; }
  .head-title h1 { margin: 0; font-size: 19px; font-weight: 800; }
  .copy-tag {
    display: inline-block; margin-top: 2px; padding: 0 10px;
    border: 1px solid var(--ink); border-radius: 999px; font-size: 10px; font-weight: 700;
  }
  .head-meta { margin: 0; display: grid; gap: 0; }
  .head-meta div { display: flex; gap: 8px; }
  .head-meta dt { color: var(--muted); min-width: 78px; }
  .head-meta dd { margin: 0; font-weight: 600; }
  .num { direction: ltr; unicode-bidi: plaintext; text-align: right; font-variant-numeric: tabular-nums; }
  .resident {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
    margin: 4px 16px 0; padding: 5px 12px;
    background: linear-gradient(90deg, rgba(31,163,220,.08), rgba(247,148,29,.08), rgba(195,214,44,.12));
    border-radius: 4px;
  }
  .resident .lbl { display: block; font-size: 9.5px; color: var(--muted); }
  .resident strong { font-size: 12.5px; }
  .block { padding: 6px 16px 0; }
  .block h2 {
    margin: 0 0 3px; font-size: 11.5px; padding-right: 7px; border-right: 3px solid var(--orange);
  }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th {
    background: var(--ink); color: #fff; font-weight: 600;
    padding: 3px 6px; text-align: right; white-space: nowrap;
  }
  td { padding: 3px 6px; border-bottom: 1px solid var(--line); white-space: nowrap; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  td.strong { font-weight: 700; }
  td.empty { text-align: center; color: var(--muted); padding: 12px; }
  td small { color: var(--muted); }
  .service { font-weight: 600; }
  .dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    margin-left: 5px; background: var(--muted);
  }
  .t-electricity { background: var(--orange); }
  .t-water { background: var(--blue); }
  .t-gas { background: var(--lime); }
  .badge {
    display: inline-block; padding: 0 8px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700;
  }
  .badge.paid { background: var(--ok-bg); color: var(--ok); }
  .badge.unpaid { background: var(--bad-bg); color: var(--bad); }
  tfoot td {
    border-bottom: 0; border-top: 2px solid var(--ink);
    font-weight: 800; font-size: 12px; padding-top: 5px;
  }
  tfoot .total { font-size: 14px; color: var(--blue); }
  tfoot .cur { color: var(--muted); font-weight: 600; font-size: 10.5px; }
  .foot {
    margin-top: auto; display: flex; justify-content: space-between;
    align-items: flex-end; gap: 12px; padding: 6px 16px 8px;
    color: var(--muted); font-size: 10px;
  }
  .foot p { margin: 0; }
  .sign { width: 1.6in; border-top: 1px solid var(--muted); text-align: center; padding-top: 1px; }
  @page { size: 8.5in 11in; margin: 0; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th, .strip span, .badge, .resident, .dot, .copy-tag {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">طباعة (نسختان في صفحة)</button>
    <button type="button" onclick="window.close()">إغلاق</button>
  </div>
  <div class="sheet">${articles}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\\/script>
</body>
</html>`
}

export function printServiceInvoice(options: ServiceInvoicePrintOptions): boolean {
  if (!options.rows.length) return false
  return Boolean(openReceiptPrintWindow(buildServiceInvoiceHtml(options)))
}

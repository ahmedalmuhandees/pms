import{_t as e,at as t,gt as n,rt as r}from"./client-eSmV7jUP.js";import{t as i}from"./receiptPrintLayout-BPwdI1CP.js";var a=[`يناير`,`فبراير`,`مارس`,`أبريل`,`مايو`,`يونيو`,`يوليو`,`أغسطس`,`سبتمبر`,`أكتوبر`,`نوفمبر`,`ديسمبر`],o={[t.Cash]:`كاش`,[t.Bank]:`بنك`,[t.Transfer]:`تحويل`,[t.Cheque]:`شيك`,[t.Card]:`ماستر`};function s(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function c(e){return Number(e||0).toLocaleString(`en-US`)}function l(e){return Math.max(0,Number(e.amount||0)-Number(e.discount||0))}function u(e){return`${a[(e.month||1)-1]||e.month} ${e.year}`}function d(e){return!e.paid||e.paymentMethod==null?`—`:o[e.paymentMethod]||String(e.paymentMethod)}function f(t){let n=t.serviceTypeName;if(n===e.Electricity)return`t-electricity`;if(n===e.Water)return`t-water`;if(n===e.Gas)return`t-gas`;let r=(t.serviceDisplayName||``).toLowerCase();return r.includes(`كهرب`)?`t-electricity`:r.includes(`ماء`)||r.includes(`مياه`)?`t-water`:r.includes(`غاز`)?`t-gas`:`t-services`}function p(e){return Number(e.billingMode)===n.Metered}function m(e){return e===r.Api?`عداد رقمي`:e===r.Manual?`قراءة يدوية`:`—`}function h(e){if(!e)return`—`;let t=new Date(e);if(Number.isNaN(t.getTime()))return s(String(e).slice(0,10));let n=String(t.getDate()).padStart(2,`0`),r=String(t.getMonth()+1).padStart(2,`0`);return`${t.getFullYear()}-${r}-${n}`}function g(e){let t=e[0];return t?`INV-${t.year}-${String(t.month).padStart(2,`0`)}-${t.id.slice(0,8).toUpperCase()}`:`—`}function _(e){let t=e.rows,r=e.currency||`د.ع`,i=e.copyLabels?.length?e.copyLabels:[`نسخة الساكن`,`نسخة الإدارة`],a=e.logoUrl?s(e.logoUrl.startsWith(`http`)||e.logoUrl.startsWith(`data:`)?e.logoUrl:`${window.location.origin}${e.logoUrl.startsWith(`/`)?``:`/`}${e.logoUrl}`):``,o=t.reduce((e,t)=>e+l(t),0),_=t.length>0&&t.every(e=>e.paid),v=t[0]?.residentName||`—`,y=t[0]?.unitNumber||`—`,b=t[0]?.dueDate?h(t[0].dueDate):`—`,x=t.find(e=>e.paidAt)?.paidAt?h(t.find(e=>e.paidAt)?.paidAt):`—`,S=h(t[0]?.paidAt||t[0]?.createdAt||new Date().toISOString()),C=g(t),w=s(e.note||`نشكركم على التزامكم بسداد الخدمات في موعدها.`),T=t.filter(p),E=t.map(e=>`<tr>
        <td class="service"><i class="dot ${f(e)}"></i>${s(e.serviceDisplayName||`—`)}</td>
        <td>${s(e.residentName||v)}</td>
        <td class="num">${s(e.unitNumber||y)}</td>
        <td>${s(u(e))}</td>
        <td class="num">${c(e.amount)}</td>
        <td class="num">${c(e.discount)}</td>
        <td class="num strong">${c(l(e))}</td>
        <td><span class="badge ${e.paid?`paid`:`unpaid`}">${e.paid?`مسدد`:`غير مسدد`}</span></td>
        <td>${s(d(e))}</td>
      </tr>`).join(``),D=t.length?``:`<tr><td colspan="9" class="empty">لا توجد بنود في هذه الفاتورة.</td></tr>`,O=T.length?`<section class="block">
        <h2>قراءات العدادات والاستهلاك</h2>
        <table class="readings">
          <thead>
            <tr>
              <th>الخدمة</th><th>مصدر القراءة</th><th>وضع الفوترة</th>
              <th>القراءة السابقة</th><th>القراءة الحالية</th><th>الاستهلاك</th>
            </tr>
          </thead>
          <tbody>
            ${T.map(e=>`<tr>
              <td class="service"><i class="dot ${f(e)}"></i>${s(e.serviceDisplayName||`—`)}</td>
              <td>${s(m(e.readingSource))}</td>
              <td>${Number(e.billingMode)===n.Metered?`حسب الاستهلاك`:`ثابت`}</td>
              <td class="num">${c(e.previousReading)}</td>
              <td class="num">${c(e.reading)}</td>
              <td class="num strong">${c(e.consumption)} <small>${s(e.unitOfMeasure||``)}</small></td>
            </tr>`).join(``)}
          </tbody>
        </table>
      </section>`:``;return`<!DOCTYPE html>
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
  <div class="sheet">${i.map((e,t)=>`
      <article class="invoice">
        <div class="strip" aria-hidden="true">
          <span class="s-blue"></span><span class="s-orange"></span><span class="s-lime"></span>
        </div>
        <header class="head">
          ${a?`<img src="${a}" alt="شعار المجمع" class="logo" />`:`<div class="logo-spacer"></div>`}
          <div class="head-title">
            <h1>فاتورة الخدمات</h1>
            <span class="copy-tag">${s(e)}</span>
          </div>
          <dl class="head-meta">
            <div><dt>رقم الفاتورة</dt><dd class="num">${s(C)}</dd></div>
            <div><dt>تاريخ الإصدار</dt><dd class="num">${S}</dd></div>
            <div><dt>تاريخ الاستحقاق</dt><dd class="num">${b}</dd></div>
            <div><dt>تاريخ الدفع</dt><dd class="num">${x}</dd></div>
          </dl>
        </header>
        <section class="resident">
          <div><span class="lbl">الساكن</span><strong>${s(v)}</strong></div>
          <div><span class="lbl">الوحدة</span><strong class="num">${s(y)}</strong></div>
          <div>
            <span class="lbl">حالة الفاتورة</span>
            <span class="badge ${_?`paid`:`unpaid`}">${_?`مسدد`:`غير مسدد`}</span>
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
            <tbody>${E||D}</tbody>
            <tfoot>
              <tr>
                <td colspan="6">الإجمالي</td>
                <td class="num total">${c(o)}</td>
                <td colspan="2" class="cur">${s(r)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
        ${O}
        <footer class="foot">
          <p>${w}</p>
          <div class="sign"><span>التوقيع / الختم</span></div>
        </footer>
      </article>
      ${t<i.length-1?`<div class="cut" aria-hidden="true"><span>✂</span></div>`:``}`).join(``)}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\\/script>
</body>
</html>`}function v(e){return e.rows.length?!!i(_(e)):!1}export{v as t};
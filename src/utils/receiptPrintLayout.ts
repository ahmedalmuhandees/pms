/**
 * طباعة الوصولات: كل نسخة بمقاس A5 (14.8×21 سم)
 * ونسختان على ورقة A4 واحدة (210×297 مم).
 * نصف الورقة = 210×148.5 مم ≈ A5 بالعرض.
 */

export const dualA5OnA4PrintCss = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    direction: rtl;
    font-family: "Arial", "Tahoma", "Segoe UI", sans-serif;
  }
  .a4-page {
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background: #fff;
  }
  .a5-copy {
    width: 210mm;
    height: 148.5mm;
    padding: 5mm 7mm 4mm;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .a5-copy + .a5-copy {
    border-top: 1px dashed #999;
  }
  .copy-badge {
    position: absolute;
    top: 2mm;
    left: 4mm;
    font-size: 9px;
    font-weight: 700;
    color: #666;
    border: 1px solid #999;
    padding: 1px 6px;
    border-radius: 3px;
  }
  .sheet {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .brand-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-height: 12mm;
    margin-bottom: 1mm;
  }
  .brand-title {
    color: #5eb7e9;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    margin: 0;
    white-space: nowrap;
  }
  .brand-logo img {
    height: 36px;
    width: auto;
    max-width: 100px;
    object-fit: contain;
    display: block;
  }
  .rule {
    border: 0;
    border-top: 1.5px dashed #5eb7e9;
    margin: 1.5mm 0 2mm;
  }
  .title-row {
    margin: 0 0 1.5mm;
    text-align: center;
  }
  .title-row h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #000;
  }
  .banner {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    margin: 1mm 0 2mm;
  }
  .meta {
    text-align: right;
    font-size: 11px;
    line-height: 1.45;
    margin: 0 0 1.5mm;
  }
  .meta strong { font-weight: 700; }
  .field {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin: 1.4mm 0;
    font-size: 11px;
  }
  .field .label {
    white-space: nowrap;
    font-weight: 700;
    padding-bottom: 1px;
  }
  .field .line {
    flex: 1;
    min-height: 1.2em;
    border-bottom: 1px dashed #666;
    text-align: center;
    font-weight: 400;
    padding: 0 4px 1px;
  }
  .amount-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 1.8mm 0;
    font-size: 11px;
  }
  .amount-row .label { font-weight: 700; white-space: nowrap; }
  .amount-box {
    border: 1.2px solid #111;
    padding: 2px 8px;
    font-weight: 700;
    font-size: 11px;
    white-space: nowrap;
    background: #fff;
  }
  .amount-words {
    flex: 1;
    text-align: center;
    font-weight: 400;
    font-size: 11px;
    border-bottom: 1px dashed #666;
    padding: 0 4px 2px;
    min-height: 1.2em;
  }
  .warn {
    color: #c00000;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
    margin: 2.5mm 0 2mm;
  }
  .signs {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 2mm 10mm 2mm;
  }
  .sign { text-align: center; min-width: 80px; }
  .sign .role { font-weight: 700; font-size: 11px; margin-bottom: 6mm; }
  .sign .name { font-size: 10px; font-weight: 400; }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 9px;
    font-weight: 700;
    color: #000;
    margin-top: auto;
    padding-top: 1mm;
  }
  .footer .addr { text-align: right; }
  .footer .tel { text-align: left; direction: ltr; unicode-bidi: isolate; font-weight: 700; }
  .sheet-bottom {
    border: 0;
    border-bottom: 1px solid #111;
    margin-top: 1.5mm;
  }
  .no-print { display: none; }
  @media screen {
    body { background: #ddd; padding: 12px 0; }
    .a4-page {
      box-shadow: 0 2px 12px rgba(0,0,0,.18);
      margin-bottom: 16px;
    }
    .no-print {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin: 0 0 10px;
    }
    .no-print button {
      border: 1px solid #111;
      background: #5eb7e9;
      color: #fff;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
  }
  @media print {
    html, body { background: #fff; }
    .a4-page { box-shadow: none; margin: 0; }
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

/** يغلّف محتوى الوصل في نسختين A5 على ورقة A4 */
export function wrapDualA5ReceiptDocument(options: {
  title: string
  sheetInnerHtml: string
  autoPrint?: boolean
}): string {
  const { title, sheetInnerHtml, autoPrint = true } = options
  const copy = (label: string) => `
    <section class="a5-copy">
      <span class="copy-badge">${label}</span>
      <div class="sheet">${sheetInnerHtml}</div>
    </section>`

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>${dualA5OnA4PrintCss}</style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">طباعة</button>
    <button type="button" onclick="window.close()">إغلاق</button>
  </div>
  <div class="a4-page">
    ${copy('نسخة 1')}
    ${copy('نسخة 2')}
  </div>
  ${autoPrint ? '<script>window.onload=function(){setTimeout(function(){window.print()},280)}<\\/script>' : ''}
</body>
</html>`
}

export function openReceiptPrintWindow(html: string): Window | null {
  const win = window.open('', '_blank')
  if (!win) return null
  win.document.open()
  win.document.write(html)
  win.document.close()
  return win
}

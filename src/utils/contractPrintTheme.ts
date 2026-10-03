/** ثيم طباعة احترافي: صفحات A4 حقيقية بدون fixed overlapping */

export const DEFAULT_CONTRACT_PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

.print-page {
  background: #dfe6db !important;
  padding: 16px !important;
}

.a4-book {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.a4-page {
  --print-primary: #2f5139;
  --print-header-bg: #b7c6ab;
  --print-muted: #4a5c4e;
  --print-line: #c5d0bf;
  box-sizing: border-box;
  width: 210mm;
  height: 297mm;
  max-height: 297mm;
  background: #fff;
  color: #1c2a20;
  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0 12px 36px rgba(47, 81, 57, 0.14);
  page-break-after: always;
  break-after: page;
  page-break-inside: avoid;
  break-inside: avoid;
}

.a4-page:last-child {
  page-break-after: auto;
  break-after: auto;
}

.a4-page .doc-topbar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background-color: var(--print-header-bg);
  background-image:
    linear-gradient(135deg, rgba(255,255,255,0.18) 25%, transparent 25%),
    linear-gradient(225deg, rgba(255,255,255,0.18) 25%, transparent 25%),
    linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%),
    linear-gradient(315deg, rgba(255,255,255,0.18) 25%, transparent 25%);
  background-size: 14px 14px;
  background-position: 0 0, 7px 0, 7px -7px, 0 7px;
  border-bottom: 1px solid #9aaf8e;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.a4-page .doc-topbar .company {
  text-align: right;
  font-weight: 700;
  color: var(--print-primary);
  font-size: 11.5px;
  line-height: 1.4;
}

.a4-page .doc-topbar .logo-wrap {
  display: grid;
  place-items: center;
}

.a4-page .doc-topbar .logo-wrap img {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.a4-page .doc-topbar .complex {
  text-align: left;
  color: var(--print-primary);
  font-weight: 700;
  line-height: 1.3;
}

.a4-page .doc-topbar .complex .ar {
  display: block;
  font-size: 14px;
}

.a4-page .doc-topbar .complex .en {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  direction: ltr;
}

.a4-main {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.a4-watermark {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 0;
  opacity: 0.1;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.a4-watermark img {
  width: min(46%, 340px);
  height: auto;
  object-fit: contain;
}

.a4-content {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 10px 18px 8px;
}

.a4-page .doc-meta-row {
  display: flex;
  justify-content: flex-start;
  padding: 0 0 6px;
  color: #222;
  font-weight: 700;
  font-size: 12.5px;
}

.a4-page .doc-title-block {
  text-align: center;
  padding: 2px 0 8px;
}

.a4-page .doc-title-block h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #111;
}

.a4-page .doc-title-block .sub {
  margin: 3px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #222;
}

.a4-page .block {
  margin-top: 10px;
}

.a4-page .block h2 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
  color: #111;
  text-decoration: underline;
  text-align: center;
}

.a4-page .block h2.is-start {
  text-align: start;
}

.a4-page .block h2 .cont-label {
  margin-inline-start: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--print-muted);
  text-decoration: none;
}

.a4-page .intro {
  margin: 0;
  text-align: justify;
  line-height: 1.75;
  font-size: 12.8px;
}

.a4-page .grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 8px;
}

.a4-page .cell {
  border: 1px solid var(--print-line);
  padding: 5px 7px;
  background: rgba(255,255,255,0.78);
}

.a4-page .cell span {
  display: block;
  color: var(--print-muted);
  font-size: 10.5px;
  font-weight: 700;
  margin-bottom: 1px;
}

.a4-page .cell strong {
  font-size: 12.5px;
  font-weight: 700;
}

.a4-page table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255,255,255,0.85);
}

.a4-page th,
.a4-page td {
  border: 1px solid var(--print-line);
  padding: 5px 6px;
  font-size: 11.5px;
  text-align: start;
}

.a4-page th {
  background: #e4ecd9;
  color: var(--print-primary);
}

.a4-page .clause {
  margin-top: 10px;
  page-break-inside: avoid;
}

.a4-page .clause-title {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: underline;
  color: #111;
}

.a4-page .clause-body {
  margin: 0;
  text-align: justify;
  line-height: 1.75;
  font-size: 12.5px;
  white-space: pre-wrap;
}

.a4-foot {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  padding: 8px 16px 12px;
  border-top: 1px solid #d5dfcf;
  background: #fff;
}

.a4-foot .signatures {
  display: grid;
  gap: 12px 20px;
  margin: 0;
}

.a4-foot .signatures.signatures-2 {
  grid-template-columns: 1fr 1fr;
}

.a4-foot .sig {
  text-align: start;
  font-weight: 700;
  font-size: 11.5px;
  line-height: 1.55;
}

.a4-foot .sig .sig-role {
  color: var(--print-ink);
}

.a4-foot .sig .sig-name {
  margin-top: 2px;
  font-weight: 600;
  font-size: 11px;
}

.a4-foot .sig .sig-line {
  margin-top: 14px;
}

.a4-foot .doc-footer {
  margin-top: 6px;
  text-align: center;
  color: var(--print-muted);
  font-size: 11px;
  font-weight: 600;
}

.a4-page-num {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  color: #8a9a88;
  font-weight: 600;
  z-index: 2;
}

/* قياس مخفي لتقسيم الصفحات */
.a4-measure {
  position: absolute;
  left: -10000px;
  top: 0;
  width: 210mm;
  visibility: hidden;
  pointer-events: none;
}

.a4-measure .a4-content {
  overflow: visible;
  padding: 10px 18px 8px;
}

.muted {
  color: #5a717a;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .print-page {
    background: #fff !important;
    padding: 0 !important;
  }

  .a4-book {
    gap: 0 !important;
  }

  .a4-page {
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
  }

  .a4-page .doc-topbar,
  .a4-watermark,
  .a4-foot {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print,
  .a4-measure {
    display: none !important;
  }
}
`.trim()

export const DEFAULT_CONTRACT_LOGO = '/contract-assets/logo.png'
export const DEFAULT_CONTRACT_WATERMARK = '/contract-assets/watermark.png'

export function isFullContractThemeCss(css: string): boolean {
  const t = css.trim()
  return (
    t.length > 1500 &&
    (t.includes('.sheet.contract-doc') || t.includes('.a4-page')) &&
    t.includes('.doc-topbar')
  )
}

export function resolveContractPrintCss(designTerms?: string | null): string {
  const raw = String(designTerms || '')
    .replace(/<\/style/gi, '<\\/style')
    .trim()

  if (!raw) return DEFAULT_CONTRACT_PRINT_CSS
  if (isFullContractThemeCss(raw)) return DEFAULT_CONTRACT_PRINT_CSS

  const overrides = raw
    .replace(/\.contract-print-watermark[^{]*\{[^}]*\}/g, '')
    .replace(/\.doc-watermark-[a-z-]*[^{]*\{[^}]*\}/g, '')
    .replace(/\.doc-signatures-[a-z-]*[^{]*\{[^}]*\}/g, '')
    .trim()

  return overrides
    ? `${DEFAULT_CONTRACT_PRINT_CSS}\n\n/* --- تخصيص التصميم --- */\n${overrides}`
    : DEFAULT_CONTRACT_PRINT_CSS
}

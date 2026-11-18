import{At as e,Ct as t,Kn as n,Ot as r,St as i,Tn as a,Vt as o,Wt as s,_ as c,_t as l,an as u,bt as d,c as f,cn as p,gn as ee,kt as m,n as h,pn as g,s as _,t as v,v as y,vn as b,wt as x,xt as S}from"./client-DhidhXbC.js";import{t as C}from"./button-CsBPUHM3.js";import{_ as w,c as te,g as T,l as ne,n as re}from"./index-DkAe5af7.js";import{t as E}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{t as D}from"./select-DlcKIctL.js";import{t as ie}from"./datepicker-DgeHxHAE.js";import{n as ae,t as O}from"./column-nyjvXmic.js";import{r as oe}from"./complexes-DngKYK7Z.js";import{n as se,t as ce}from"./useNotify-CQSPBvTJ.js";import{t as le}from"./FilterBar-Bpxn1zLk.js";import{t as ue}from"./usePagedList-C3F5b3EB.js";import{t as de}from"./PageHeader-DZkgevaX.js";import{n as fe,t as pe}from"./TableSkeleton-D_1Iaolu.js";import{t as me}from"./RowActions-DBU6qCVZ.js";import{t as he}from"./autocomplete-Bfa_5BW0.js";async function ge(e){return _(await v.get(`/api/SalesCommissions`,{params:e}))}async function _e(e,t){return _(await v.get(`/api/SalesCommissions/contracts`,{params:{complexId:e,search:t}}))}async function ve(e){return _(await v.post(`/api/SalesCommissions`,e))}async function ye(e,t){return _(await v.put(`/api/SalesCommissions/${e}`,t))}async function be(e){return _(await v.delete(`/api/SalesCommissions/${e}`))}var xe={class:`page`},Se={class:`data-panel`},k={class:`form-grid`},A={key:0,class:`field`},j={class:`field`},Ce={class:`contract-opt`},we={class:`field`},Te={class:`field`},Ee={class:`field`},De={class:`hint`},Oe={class:`field`},ke={class:`hint`},Ae={class:`field`},je={class:`field full`},Me={class:`field full`},Ne={class:`field full`},Pe={class:`red-note`},Fe={class:`signs-preview full`},M=E(e({__name:`SalesCommissionsView`,setup(e){let _=re(),v=se(),{ask:E}=ce(),M=b([]),N=b(_.scopedComplexId),P=b([]),F=b(null),{items:I,loading:Ie,page:Le,pageSize:L,total:Re,search:R,load:z,onSearch:ze,setFilter:B,setSortMode:Be,onTableSort:Ve,sortField:He,sortOrder:Ue,sortMode:V,onLazyPage:We}=ue(ge),H=b(!1),U=b(!1),W=b(null),G=b(new Date),K=ee({complexId:``,salesContractId:``,commissionPercent:2,commissionAmount:0,consultantName:``,customerName:``,customerPhone:``,unitNumber:``,sellingPrice:0}),q=d(()=>f(M.value,e=>e.nameAr||e.name||e.id)),J=d(()=>`عمولة ${Z(K.commissionPercent)}% للشقة رقم ${K.unitNumber||`—`}`),Ge=d(()=>`العمولة الادارية عمولة ${Z(K.commissionPercent)}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`),Ke=d(()=>$(K.commissionAmount));u(()=>[K.commissionPercent,K.sellingPrice],([e,t])=>{t>0&&e>0&&(K.commissionAmount=Math.round(t*e/100))}),u(N,e=>{B(`ComplexId`,e||void 0)});async function qe(){let e=await oe({Page:1,PageSize:200});M.value=e.items??[]}async function Je(e){let t=K.complexId||N.value;if(!t){P.value=[];return}P.value=await _e(t,e.query||void 0)}function Y(e){if(!e||typeof e!=`object`||!(`id`in e)){K.salesContractId=``,K.customerName=``,K.customerPhone=``,K.unitNumber=``,K.sellingPrice=0,K.commissionAmount=0;return}K.salesContractId=e.id,K.complexId=e.complexId,K.customerName=e.customerName,K.customerPhone=e.customerPhone||``,K.unitNumber=e.unitNumber||``,K.sellingPrice=e.sellingPrice,K.commissionPercent>0&&(K.commissionAmount=Math.round(e.sellingPrice*K.commissionPercent/100))}u(F,e=>Y(e));function Ye(){W.value=null,G.value=new Date,F.value=null,Object.assign(K,{complexId:N.value||_.scopedComplexId||``,salesContractId:``,commissionPercent:2,commissionAmount:0,consultantName:``,customerName:``,customerPhone:``,unitNumber:``,sellingPrice:0}),H.value=!0}function Xe(e){W.value=e.id,G.value=e.receiptDate?new Date(e.receiptDate):new Date,F.value={id:e.salesContractId,contractNumber:e.contractNumber||``,customerName:e.customerName,customerPhone:e.customerPhone,unitNumber:e.unitNumber,sellingPrice:e.sellingPrice,complexId:e.complexId},Object.assign(K,{complexId:e.complexId,salesContractId:e.salesContractId,commissionPercent:e.commissionPercent,commissionAmount:e.commissionAmount,consultantName:e.consultantName||``,customerName:e.customerName,customerPhone:e.customerPhone||``,unitNumber:e.unitNumber||``,sellingPrice:e.sellingPrice}),H.value=!0}function Ze(){return{salesContractId:K.salesContractId,complexId:K.complexId,receiptDate:G.value?new Date(G.value.getFullYear(),G.value.getMonth(),G.value.getDate()).toISOString():null,commissionPercent:K.commissionPercent,commissionAmount:K.commissionAmount,description:J.value,consultantName:K.consultantName||null}}async function Qe(){if(!K.complexId||!K.salesContractId){v.warning(`اختر المجمع والعقد`);return}if(!K.commissionPercent||K.commissionPercent<=0){v.warning(`أدخل نسبة المبيعات`);return}U.value=!0;try{let e=Ze(),t=W.value?await ye(W.value,e):await ve(e);v.success(W.value?`تم تحديث الوصل`:`تم إنشاء الوصل`),H.value=!1,await z(),X(t)}catch(e){v.error(h(e))}finally{U.value=!1}}async function $e(e){if(await E(`حذف وصل العمولة رقم ${e.receiptNumber}؟`))try{await be(e.id),v.success(`تم الحذف`),await z()}catch(e){v.error(h(e))}}function et(e){return M.value.find(t=>t.id===e)}function tt(e){if(!e)return!1;let t=(e.nameAr||``).toLowerCase(),n=(e.name||``).toLowerCase(),r=(e.portalSlug||``).toLowerCase();return t.includes(`سما`)||n.includes(`sama`)||r.includes(`sama`)}function X(e){let t=et(e.complexId),n=tt(t)?`/brands/samalogo.png`:t?.logoUrl?te(t.logoUrl):``,r=[t?.address,t?.city].filter(Boolean).join(` - `)||`بغداد - حي الجهاد الاطباء - سريع مطار بغداد الدولي`,i=nt(e.receiptDate),a=e.receiptNumber?.replace(/^SC-\d+-/,``)||e.receiptNumber,o=`${y(e.commissionAmount)}IQD`,s=$(e.commissionAmount),c=e.customerPhone?.trim()||`/`,l=Z(e.commissionPercent),u=`العمولة الادارية ${l}% في حالة تم الاسترجاع يتم خصم ١% من مبلغ العمولة`,d=e.description||`عمولة ${l}% للشقة رقم ${e.unitNumber||`—`}`,f=`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>وصل قبض — ${Q(e.receiptNumber)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    direction: rtl;
    font-family: "Arial", "Tahoma", "Segoe UI", sans-serif;
  }
  .sheet {
    width: 273mm;
    max-width: 100%;
    min-height: 180mm;
    margin: 0 auto;
    padding: 8mm 10mm 6mm;
    position: relative;
  }
  .brand-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-height: 22mm;
    margin-bottom: 2mm;
  }
  /* RTL: أول عنصر = اليمين */
  .brand-title {
    color: #5eb7e9;
    font-size: 42px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
    margin: 0;
    padding: 0 2mm 0 0;
    white-space: nowrap;
  }
  .brand-logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 0 0 2mm;
  }
  .brand-logo img {
    height: 68px;
    width: auto;
    max-width: 170px;
    object-fit: contain;
    display: block;
  }
  .rule {
    border: 0;
    border-top: 2.5px dashed #5eb7e9;
    margin: 3mm 0 4mm;
  }
  .title-row {
    margin: 1mm 0 3mm;
    text-align: center;
  }
  .title-row h1 {
    margin: 0;
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    color: #000;
  }
  .meta {
    text-align: right;
    font-size: 16px;
    line-height: 1.7;
    margin: 0 0 3mm;
  }
  .meta strong { font-weight: 700; }
  .field {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin: 3.2mm 0;
    font-size: 16px;
  }
  .field .label {
    white-space: nowrap;
    font-weight: 700;
    padding-bottom: 2px;
  }
  .field .line {
    flex: 1;
    min-height: 1.35em;
    border-bottom: 1.5px dashed #666;
    text-align: center;
    font-weight: 400;
    padding: 0 8px 2px;
  }
  .amount-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 3.5mm 0;
    font-size: 16px;
  }
  .amount-row .label { font-weight: 700; white-space: nowrap; }
  .amount-box {
    border: 1.6px solid #111;
    padding: 4px 14px;
    font-weight: 700;
    font-size: 16px;
    white-space: nowrap;
    background: #fff;
  }
  .amount-words {
    flex: 1;
    text-align: center;
    font-weight: 400;
    font-size: 16px;
    border-bottom: 1.5px dashed #666;
    padding: 0 8px 3px;
    min-height: 1.35em;
  }
  .warn {
    color: #c00000;
    font-size: 15px;
    font-weight: 700;
    text-align: center;
    margin: 6mm 0 5mm;
  }
  .signs {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 2mm 18mm 6mm;
  }
  .sign { text-align: center; min-width: 140px; }
  .sign .role { font-weight: 700; font-size: 17px; margin-bottom: 10mm; }
  .sign .name { font-size: 15px; font-weight: 400; }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #000;
    margin-top: 1mm;
  }
  .footer .addr { text-align: right; }
  .footer .tel { text-align: left; direction: ltr; unicode-bidi: isolate; font-weight: 700; }
  .sheet-bottom {
    border: 0;
    border-bottom: 1px solid #111;
    margin-top: 4mm;
  }
  @media print {
    html, body { background: #fff; }
    .sheet { width: auto; padding: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="brand-header">
      <div class="brand-title">أبراج سما</div>
      <div class="brand-logo">
        ${n?`<img src="${Q(n)}" alt="SAMA TOWERS"/>`:``}
      </div>
    </div>
    <hr class="rule"/>

    <div class="title-row">
      <h1>وصل قبض</h1>
    </div>

    <div class="meta">
      <div><strong>تاريخ :</strong> ${Q(i)}</div>
      <div><strong>رقم :</strong> ${Q(a)}</div>
    </div>

    <div class="field">
      <span class="label">استلمت من السيد/ة :</span>
      <span class="line">${Q(e.customerName||`—`)}</span>
    </div>
    <div class="field">
      <span class="label">رقم الموبايل :</span>
      <span class="line">${Q(c)}</span>
    </div>
    <div class="amount-row">
      <span class="label">مبلغا و قدره :</span>
      <span class="amount-box">${Q(o)}</span>
      <span class="amount-words">${Q(s)}</span>
    </div>
    <div class="field">
      <span class="label">و ذلك عن :</span>
      <span class="line">${Q(d)}</span>
    </div>
    <div class="field">
      <span class="label">مستشار العقاري :</span>
      <span class="line">${Q(e.consultantName||`—`)}</span>
    </div>

    <div class="warn">${Q(u)}</div>

    <div class="signs">
      <div class="sign">
        <div class="role">زبون</div>
        <div class="name">${Q(e.customerName||`—`)}</div>
      </div>
      <div class="sign">
        <div class="role">محاسب</div>
        <div class="name">${Q(e.accountantName||`—`)}</div>
      </div>
    </div>

    <hr class="rule"/>
    <div class="footer">
      <div class="addr">${Q(r)}</div>
      <div class="tel">${Q(`+(964) 77 5000 9181 - 78 5000 9181`)}</div>
    </div>
    <div class="sheet-bottom"></div>
  </div>
</body>
</html>`,p=window.open(``,`_blank`);if(!p){v.warning(`اسمح بالنوافذ المنبثقة للطباعة`);return}p.document.open(),p.document.write(f),p.document.close()}function Z(e){return e==null||Number.isNaN(e)?`0`:Number.isInteger(e)?String(e):e.toFixed(2).replace(/\.?0+$/,``)}function nt(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:`${String(t.getDate()).padStart(2,`0`)}/${String(t.getMonth()+1).padStart(2,`0`)}/${t.getFullYear()}`}function Q(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function $(e){let t=Math.round(Math.abs(e||0));if(t===0)return`صفر دينار`;let n=[``,`واحد`,`اثنان`,`ثلاثة`,`أربعة`,`خمسة`,`ستة`,`سبعة`,`ثمانية`,`تسعة`,`عشرة`,`أحد عشر`,`اثنا عشر`,`ثلاثة عشر`,`أربعة عشر`,`خمسة عشر`,`ستة عشر`,`سبعة عشر`,`ثمانية عشر`,`تسعة عشر`],r=[``,``,`عشرون`,`ثلاثون`,`أربعون`,`خمسون`,`ستون`,`سبعون`,`ثمانون`,`تسعون`],i=[``,`مائة`,`مائتان`,`ثلاثمائة`,`أربعمائة`,`خمسمائة`,`ستمائة`,`سبعمائة`,`ثمانمائة`,`تسعمائة`];function a(e){if(e===0)return``;if(e<20)return n[e];if(e<100){let t=Math.floor(e/10),i=e%10;return i?`${n[i]} و${r[t]}`:r[t]}let t=Math.floor(e/100),o=e%100;return o?`${i[t]} و${a(o)}`:i[t]}let o=[],s=Math.floor(t/1e6),c=Math.floor(t%1e6/1e3),l=t%1e3;return s&&(s===1?o.push(`مليون`):s===2?o.push(`مليونان`):s>=3&&s<=10?o.push(`${a(s)} ملايين`):o.push(`${a(s)} مليون`)),c&&(c===1?o.push(`ألف`):c===2?o.push(`ألفان`):c>=3&&c<=10?o.push(`${a(c)} آلاف`):o.push(`${a(c)} ألف`)),l&&o.push(a(l)),`${o.join(` و`)} دينار`}return o(async()=>{try{await qe(),N.value||=_.scopedComplexId||M.value[0]?.id||null,N.value?B(`ComplexId`,N.value):await z()}catch(e){v.error(h(e))}}),(e,o)=>(s(),x(`div`,xe,[m(de,{title:`نسبة المبيعات`,subtitle:`وصولات عمولة المبيعات وطباعتها`},{actions:p(()=>[m(a(C),{label:`وصل جديد`,icon:`pi pi-plus`,onClick:Ye})]),_:1}),S(`div`,Se,[m(le,{search:a(R),"onUpdate:search":o[1]||=e=>g(R)?R.value=e:null,placeholder:`بحث برقم الوصل / العميل / الوحدة`,onSearch:a(ze),"sort-mode":a(V),"onUpdate:sortMode":o[2]||=e=>g(V)?V.value=e:null,onSortChange:a(Be)},{default:p(()=>[a(_).canSelectComplex?(s(),i(a(D),{key:0,modelValue:N.value,"onUpdate:modelValue":o[0]||=e=>N.value=e,options:q.value,"option-label":`label`,"option-value":`id`,placeholder:`المجمع`,"show-clear":``,"append-to":`body`},null,8,[`modelValue`,`options`])):t(``,!0)]),_:1},8,[`search`,`onSearch`,`sort-mode`,`onSortChange`]),a(Ie)&&!a(I).length?(s(),i(pe,{key:0})):(s(),x(l,{key:1},[m(fe,{"sort-mode":a(V)},null,8,[`sort-mode`]),m(a(ae),{value:a(I),lazy:!0,paginator:!0,rows:a(L),"total-records":a(Re),first:(a(Le)-1)*a(L),"data-key":`id`,"striped-rows":``,onPage:a(We),"sort-mode":`single`,"sort-field":a(He),"sort-order":a(Ue),"removable-sort":``,onSort:a(Ve)},{empty:p(()=>[...o[11]||=[S(`div`,{class:`empty-box`},`لا توجد وصولات عمولة`,-1)]]),default:p(()=>[m(a(O),{field:`receiptNumber`,header:`رقم الوصل`,sortable:``}),m(a(O),{field:`receiptDate`,header:`التاريخ`,sortable:``},{body:p(({data:e})=>[r(n(a(c)(e.receiptDate)),1)]),_:1}),m(a(O),{field:`customerName`,header:`العميل`}),m(a(O),{field:`unitNumber`,header:`الوحدة`}),m(a(O),{field:`commissionPercent`,header:`النسبة`},{body:p(({data:e})=>[r(n(Z(e.commissionPercent))+`%`,1)]),_:1}),m(a(O),{field:`commissionAmount`,header:`المبلغ`},{body:p(({data:e})=>[r(n(a(y)(e.commissionAmount)),1)]),_:1}),m(a(O),{field:`consultantName`,header:`المستشار`}),m(a(O),{field:`accountantName`,header:`المحاسب`}),m(a(O),{header:``,style:{width:`8rem`}},{body:p(({data:e})=>[m(me,{"show-print":``,onEdit:t=>Xe(e),onRemove:t=>$e(e),onPrint:t=>X(e)},null,8,[`onEdit`,`onRemove`,`onPrint`])]),_:1})]),_:1},8,[`value`,`rows`,`total-records`,`first`,`onPage`,`sort-field`,`sort-order`,`onSort`])],64))]),m(a(ne),{visible:H.value,"onUpdate:visible":o[10]||=e=>H.value=e,modal:``,header:W.value?`تعديل وصل نسبة المبيعات`:`وصل نسبة مبيعات جديد`,style:{width:`640px`},breakpoints:{"960px":`95vw`}},{footer:p(()=>[m(a(C),{label:`إلغاء`,severity:`secondary`,text:``,onClick:o[9]||=e=>H.value=!1}),m(a(C),{label:W.value?`حفظ وطباعة`:`إنشاء وطباعة`,icon:`pi pi-print`,loading:U.value,onClick:Qe},null,8,[`label`,`loading`])]),default:p(()=>[S(`div`,k,[a(_).canSelectComplex?(s(),x(`div`,A,[o[12]||=S(`label`,null,`المجمع`,-1),m(a(D),{modelValue:K.complexId,"onUpdate:modelValue":o[3]||=e=>K.complexId=e,options:q.value,"option-label":`label`,"option-value":`id`,placeholder:`اختر المجمع`,class:`w-full`,"append-to":`body`,disabled:!!W.value},null,8,[`modelValue`,`options`,`disabled`])])):t(``,!0),S(`div`,j,[o[13]||=S(`label`,null,`اختيار العقد`,-1),m(a(he),{modelValue:F.value,"onUpdate:modelValue":o[4]||=e=>F.value=e,suggestions:P.value,"option-label":`contractNumber`,"force-selection":``,dropdown:``,class:`w-full`,placeholder:`ابحث برقم العقد / العميل / الوحدة`,onComplete:Je},{option:p(({option:e})=>[S(`div`,Ce,[S(`strong`,null,n(e.contractNumber),1),S(`span`,null,n(e.customerName)+` — `+n(e.unitNumber||`—`),1)])]),_:1},8,[`modelValue`,`suggestions`])]),S(`div`,we,[o[14]||=S(`label`,null,`اسم العميل`,-1),m(a(w),{"model-value":K.customerName,class:`w-full`,disabled:``},null,8,[`model-value`])]),S(`div`,Te,[o[15]||=S(`label`,null,`رقم الهاتف`,-1),m(a(w),{"model-value":K.customerPhone||`/`,class:`w-full`,disabled:``},null,8,[`model-value`])]),S(`div`,Ee,[o[16]||=S(`label`,null,`نسبة المبيعات %`,-1),m(a(T),{modelValue:K.commissionPercent,"onUpdate:modelValue":o[5]||=e=>K.commissionPercent=e,min:.01,max:100,"min-fraction-digits":0,"max-fraction-digits":2,suffix:` %`,class:`w-full`},null,8,[`modelValue`]),S(`small`,De,`من مبلغ سعر الشقة: `+n(a(y)(K.sellingPrice)),1)]),S(`div`,Oe,[o[17]||=S(`label`,null,`مبلغاً وقدره`,-1),m(a(T),{modelValue:K.commissionAmount,"onUpdate:modelValue":o[6]||=e=>K.commissionAmount=e,min:0,"min-fraction-digits":0,"max-fraction-digits":0,class:`w-full`},null,8,[`modelValue`]),S(`small`,ke,n(Ke.value),1)]),S(`div`,Ae,[o[18]||=S(`label`,null,`تاريخ الوصل`,-1),m(a(ie),{modelValue:G.value,"onUpdate:modelValue":o[7]||=e=>G.value=e,"date-format":`dd/mm/yy`,"show-icon":``,class:`w-full`},null,8,[`modelValue`])]),S(`div`,je,[o[19]||=S(`label`,null,`وذلك عن`,-1),m(a(w),{"model-value":J.value,class:`w-full`,disabled:``},null,8,[`model-value`])]),S(`div`,Me,[o[20]||=S(`label`,null,`مستشار عقاري`,-1),m(a(w),{modelValue:K.consultantName,"onUpdate:modelValue":o[8]||=e=>K.consultantName=e,class:`w-full`,placeholder:`يُدخل يدوياً`},null,8,[`modelValue`])]),S(`div`,Ne,[S(`p`,Pe,n(Ge.value),1)]),S(`div`,Fe,[S(`div`,null,[o[21]||=S(`strong`,null,`زبون`,-1),S(`div`,null,n(K.customerName||`—`),1)]),S(`div`,null,[o[22]||=S(`strong`,null,`محاسب`,-1),S(`div`,null,n(a(_).displayName||`—`),1)])])])]),_:1},8,[`visible`,`header`])]))}}),[[`__scopeId`,`data-v-5db4c307`]]);export{M as default};
import{$ as e,A as t,D as n,G as r,J as i,Mt as a,c as o,dt as s,g as c,h as l,it as u,l as d,m as f,nt as p,o as m,r as h,s as g,u as _}from"./runtime-core.esm-bundler-Dhk7EoYY.js";import{t as v}from"./button-Ik5BKO1o.js";import{Et as y,Tt as b,b as ee,c as x,d as te,l as S,s as ne,t as re,u as C,vt as ie,x as w}from"./index-g3qPkqhM.js";import{t as T}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{t as E}from"./select-DykELKaQ.js";import{t as ae}from"./datepicker-47hYRWq6.js";import{n as oe,t as D}from"./column-D3W5-Vis.js";import{r as se}from"./complexes-C94sugYF.js";import{n as ce,t as le}from"./useNotify-larOAz1y.js";import{t as ue}from"./FilterBar-Z253r9xl.js";import{t as de}from"./usePagedList-BeDSWftZ.js";import{t as fe}from"./PageHeader-BJdmWiHI.js";import{n as pe,t as me}from"./TableSkeleton-XmzLO1on.js";import{t as he}from"./RowActions-CbH1YFAM.js";import{t as ge}from"./autocomplete-CVACdDGQ.js";async function _e(e){return C(await x.get(`/api/SalesCommissions`,{params:e}))}async function ve(e,t){return C(await x.get(`/api/SalesCommissions/contracts`,{params:{complexId:e,search:t}}))}async function ye(e){return C(await x.post(`/api/SalesCommissions`,e))}async function be(e,t){return C(await x.put(`/api/SalesCommissions/${e}`,t))}async function xe(e){return C(await x.delete(`/api/SalesCommissions/${e}`))}var Se={class:`page`},O={class:`data-panel`},k={class:`form-grid`},A={key:0,class:`field`},j={class:`field`},Ce={class:`contract-opt`},we={class:`field`},Te={class:`field`},Ee={class:`field`},De={class:`hint`},Oe={class:`field`},ke={class:`hint`},Ae={class:`field`},je={class:`field full`},Me={class:`field full`},Ne={class:`field full`},Pe={class:`red-note`},Fe={class:`signs-preview full`},M=T(c({__name:`SalesCommissionsView`,setup(c){let x=re(),C=ce(),{ask:T}=le(),M=u([]),N=u(x.scopedComplexId),P=u([]),F=u(null),{items:I,loading:Ie,page:Le,pageSize:L,total:Re,search:R,load:z,onSearch:ze,setFilter:B,setSortMode:Be,onTableSort:Ve,sortField:He,sortOrder:Ue,sortMode:V,onLazyPage:We}=de(_e),H=u(!1),U=u(!1),W=u(null),G=u(new Date),K=p({complexId:``,salesContractId:``,commissionPercent:2,commissionAmount:0,consultantName:``,customerName:``,customerPhone:``,unitNumber:``,sellingPrice:0}),q=m(()=>te(M.value,e=>e.nameAr||e.name||e.id)),J=m(()=>`عمولة ${Z(K.commissionPercent)}% للشقة رقم ${K.unitNumber||`—`}`),Ge=m(()=>`العمولة الادارية عمولة ${Z(K.commissionPercent)}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`),Ke=m(()=>$(K.commissionAmount));r(()=>[K.commissionPercent,K.sellingPrice],([e,t])=>{t>0&&e>0&&(K.commissionAmount=Math.round(t*e/100))}),r(N,e=>{B(`ComplexId`,e||void 0)});async function qe(){let e=await se({Page:1,PageSize:200});M.value=e.items??[]}async function Je(e){let t=K.complexId||N.value;if(!t){P.value=[];return}P.value=await ve(t,e.query||void 0)}function Y(e){if(!e||typeof e!=`object`||!(`id`in e)){K.salesContractId=``,K.customerName=``,K.customerPhone=``,K.unitNumber=``,K.sellingPrice=0,K.commissionAmount=0;return}K.salesContractId=e.id,K.complexId=e.complexId,K.customerName=e.customerName,K.customerPhone=e.customerPhone||``,K.unitNumber=e.unitNumber||``,K.sellingPrice=e.sellingPrice,K.commissionPercent>0&&(K.commissionAmount=Math.round(e.sellingPrice*K.commissionPercent/100))}r(F,e=>Y(e));function Ye(){W.value=null,G.value=new Date,F.value=null,Object.assign(K,{complexId:N.value||x.scopedComplexId||``,salesContractId:``,commissionPercent:2,commissionAmount:0,consultantName:``,customerName:``,customerPhone:``,unitNumber:``,sellingPrice:0}),H.value=!0}function Xe(e){W.value=e.id,G.value=e.receiptDate?new Date(e.receiptDate):new Date,F.value={id:e.salesContractId,contractNumber:e.contractNumber||``,customerName:e.customerName,customerPhone:e.customerPhone,unitNumber:e.unitNumber,sellingPrice:e.sellingPrice,complexId:e.complexId},Object.assign(K,{complexId:e.complexId,salesContractId:e.salesContractId,commissionPercent:e.commissionPercent,commissionAmount:e.commissionAmount,consultantName:e.consultantName||``,customerName:e.customerName,customerPhone:e.customerPhone||``,unitNumber:e.unitNumber||``,sellingPrice:e.sellingPrice}),H.value=!0}function Ze(){return{salesContractId:K.salesContractId,complexId:K.complexId,receiptDate:G.value?new Date(G.value.getFullYear(),G.value.getMonth(),G.value.getDate()).toISOString():null,commissionPercent:K.commissionPercent,commissionAmount:K.commissionAmount,description:J.value,consultantName:K.consultantName||null}}async function Qe(){if(!K.complexId||!K.salesContractId){C.warning(`اختر المجمع والعقد`);return}if(!K.commissionPercent||K.commissionPercent<=0){C.warning(`أدخل نسبة المبيعات`);return}U.value=!0;try{let e=Ze(),t=W.value?await be(W.value,e):await ye(e);C.success(W.value?`تم تحديث الوصل`:`تم إنشاء الوصل`),H.value=!1,await z(),X(t)}catch(e){C.error(S(e))}finally{U.value=!1}}async function $e(e){if(await T(`حذف وصل العمولة رقم ${e.receiptNumber}؟`))try{await xe(e.id),C.success(`تم الحذف`),await z()}catch(e){C.error(S(e))}}function et(e){return M.value.find(t=>t.id===e)}function X(e){let t=et(e.complexId),n=t?.nameAr||e.complexName||`المجمع`,r=t?.name||``,i=t?.logoUrl?ne(t.logoUrl):``,a=[t?.address,t?.city].filter(Boolean).join(` - `)||``,o=tt(e.receiptDate),s=e.receiptNumber?.replace(/^SC-\d+-/,``)||e.receiptNumber,c=`${w(e.commissionAmount)} IQD`,l=$(e.commissionAmount),u=e.customerPhone?.trim()||`/`,d=Z(e.commissionPercent),f=`العمولة الادارية عمولة ${d}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`,p=e.description||`عمولة ${d}% للشقة رقم ${e.unitNumber||`—`}`,m=`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>وصل قبض — ${Q(e.receiptNumber)}</title>
<style>
  @page { size: A5 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", Arial, sans-serif;
    color: #111;
    background: #fff;
    direction: rtl;
  }
  .sheet {
    position: relative;
    width: 100%;
    min-height: 130mm;
    padding: 10mm 14mm 10mm 10mm;
    border: 1.5px solid #1a4f9c;
  }
  .side-strip {
    position: absolute;
    top: 8mm;
    bottom: 8mm;
    right: 4mm;
    width: 0;
    border-right: 2px dotted #1a4f9c;
  }
  .side-contact {
    position: absolute;
    top: 50%;
    right: 1.5mm;
    transform: translateY(-50%) rotate(90deg);
    transform-origin: right center;
    white-space: nowrap;
    font-size: 9px;
    color: #1a4f9c;
    letter-spacing: 0.2px;
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 120px;
  }
  .brand img { height: 42px; width: auto; object-fit: contain; }
  .brand-text .ar {
    font-size: 22px;
    font-weight: 800;
    color: #1a4f9c;
    line-height: 1.1;
  }
  .brand-text .en {
    font-size: 11px;
    font-weight: 700;
    color: #1a4f9c;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .title-block { text-align: center; flex: 1; }
  .title-block h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
  }
  .meta {
    font-size: 13px;
    line-height: 1.7;
    min-width: 110px;
    text-align: left;
  }
  .meta strong { font-weight: 700; }
  .field {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 7px 0;
    font-size: 14px;
  }
  .field .label { white-space: nowrap; font-weight: 600; }
  .field .line {
    flex: 1;
    border-bottom: 1px dotted #444;
    min-height: 1.2em;
    padding: 0 6px 2px;
  }
  .amount-box {
    display: inline-block;
    background: #d9d9d9;
    border: 1px solid #888;
    padding: 4px 14px;
    font-weight: 700;
    font-size: 15px;
    min-width: 160px;
    text-align: center;
  }
  .words {
    margin: 4px 0 8px;
    font-size: 14px;
    font-weight: 600;
    padding-right: 4px;
  }
  .warn {
    color: #c00000;
    font-size: 13px;
    font-weight: 700;
    margin: 14px 0 18px;
    text-align: center;
  }
  .signs {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 8px;
    padding: 0 20px;
  }
  .sign {
    text-align: center;
    min-width: 140px;
  }
  .sign .role { font-weight: 800; font-size: 15px; margin-bottom: 28px; }
  .sign .name { font-size: 13px; font-weight: 600; border-top: 1px solid transparent; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { border-color: #1a4f9c; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="side-strip"></div>
    ${a?`<div class="side-contact">${Q(a)}</div>`:``}
    <div class="header">
      <div class="brand">
        ${i?`<img src="${Q(i)}" alt=""/>`:``}
        <div class="brand-text">
          <div class="ar">${Q(n)}</div>
          ${r?`<div class="en">${Q(r)}</div>`:``}
        </div>
      </div>
      <div class="title-block"><h1>وصل قبض</h1></div>
      <div class="meta">
        <div><strong>تاريخ :</strong> ${Q(o)}</div>
        <div><strong>رقم :</strong> ${Q(s)}</div>
      </div>
    </div>

    <div class="field">
      <span class="label">استلمت من السيد/ة</span>
      <span class="line">${Q(e.customerName||`—`)}</span>
    </div>
    <div class="field">
      <span class="label">رقم الموبايل</span>
      <span class="line">${Q(u)}</span>
    </div>
    <div class="field">
      <span class="label">مبلغاً وقدره</span>
      <span class="amount-box">${Q(c)}</span>
    </div>
    <div class="words">${Q(l)}</div>
    <div class="field">
      <span class="label">وذلك عن</span>
      <span class="line">${Q(p)}</span>
    </div>
    <div class="field">
      <span class="label">مستشار العقاري</span>
      <span class="line">${Q(e.consultantName||`—`)}</span>
    </div>

    <div class="warn">${Q(f)}</div>

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
  </div>
  <script>window.onload = function () { window.print(); }<\/script>
</body>
</html>`,h=window.open(``,`_blank`);if(!h){C.warning(`اسمح بالنوافذ المنبثقة للطباعة`);return}h.document.open(),h.document.write(m),h.document.close()}function Z(e){return e==null||Number.isNaN(e)?`0`:Number.isInteger(e)?String(e):e.toFixed(2).replace(/\.?0+$/,``)}function tt(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:`${String(t.getDate()).padStart(2,`0`)}/${String(t.getMonth()+1).padStart(2,`0`)}/${t.getFullYear()}`}function Q(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function $(e){let t=Math.round(Math.abs(e||0));if(t===0)return`صفر دينار عراقي`;let n=[``,`واحد`,`اثنان`,`ثلاثة`,`أربعة`,`خمسة`,`ستة`,`سبعة`,`ثمانية`,`تسعة`,`عشرة`,`أحد عشر`,`اثنا عشر`,`ثلاثة عشر`,`أربعة عشر`,`خمسة عشر`,`ستة عشر`,`سبعة عشر`,`ثمانية عشر`,`تسعة عشر`],r=[``,``,`عشرون`,`ثلاثون`,`أربعون`,`خمسون`,`ستون`,`سبعون`,`ثمانون`,`تسعون`],i=[``,`مائة`,`مائتان`,`ثلاثمائة`,`أربعمائة`,`خمسمائة`,`ستمائة`,`سبعمائة`,`ثمانمائة`,`تسعمائة`];function a(e){if(e===0)return``;if(e<20)return n[e];if(e<100){let t=Math.floor(e/10),i=e%10;return i?`${n[i]} و${r[t]}`:r[t]}let t=Math.floor(e/100),o=e%100;return o?`${i[t]} و${a(o)}`:i[t]}let o=[],s=Math.floor(t/1e6),c=Math.floor(t%1e6/1e3),l=t%1e3;return s&&(s===1?o.push(`مليون`):s===2?o.push(`مليونان`):s>=3&&s<=10?o.push(`${a(s)} ملايين`):o.push(`${a(s)} مليون`)),c&&(c===1?o.push(`ألف`):c===2?o.push(`ألفان`):c>=3&&c<=10?o.push(`${a(c)} آلاف`):o.push(`${a(c)} ألف`)),l&&o.push(a(l)),`${o.join(` و`)} دينار عراقي`}return n(async()=>{try{await qe(),N.value||=x.scopedComplexId||M.value[0]?.id||null,N.value?B(`ComplexId`,N.value):await z()}catch(e){C.error(S(e))}}),(n,r)=>(t(),_(`div`,Se,[l(fe,{title:`نسبة المبيعات`,subtitle:`وصولات عمولة المبيعات وطباعتها`},{actions:i(()=>[l(s(v),{label:`وصل جديد`,icon:`pi pi-plus`,onClick:Ye})]),_:1}),g(`div`,O,[l(ue,{search:s(R),"onUpdate:search":r[1]||=t=>e(R)?R.value=t:null,placeholder:`بحث برقم الوصل / العميل / الوحدة`,onSearch:s(ze),"sort-mode":s(V),"onUpdate:sortMode":r[2]||=t=>e(V)?V.value=t:null,onSortChange:s(Be)},{default:i(()=>[s(x).canSelectComplex?(t(),o(s(E),{key:0,modelValue:N.value,"onUpdate:modelValue":r[0]||=e=>N.value=e,options:q.value,"option-label":`label`,"option-value":`id`,placeholder:`المجمع`,"show-clear":``,"append-to":`body`},null,8,[`modelValue`,`options`])):d(``,!0)]),_:1},8,[`search`,`onSearch`,`sort-mode`,`onSortChange`]),s(Ie)&&!s(I).length?(t(),o(me,{key:0})):(t(),_(h,{key:1},[l(pe,{"sort-mode":s(V)},null,8,[`sort-mode`]),l(s(oe),{value:s(I),lazy:!0,paginator:!0,rows:s(L),"total-records":s(Re),first:(s(Le)-1)*s(L),"data-key":`id`,"striped-rows":``,onPage:s(We),"sort-mode":`single`,"sort-field":s(He),"sort-order":s(Ue),"removable-sort":``,onSort:s(Ve)},{empty:i(()=>[...r[11]||=[g(`div`,{class:`empty-box`},`لا توجد وصولات عمولة`,-1)]]),default:i(()=>[l(s(D),{field:`receiptNumber`,header:`رقم الوصل`,sortable:``}),l(s(D),{field:`receiptDate`,header:`التاريخ`,sortable:``},{body:i(({data:e})=>[f(a(s(ee)(e.receiptDate)),1)]),_:1}),l(s(D),{field:`customerName`,header:`العميل`}),l(s(D),{field:`unitNumber`,header:`الوحدة`}),l(s(D),{field:`commissionPercent`,header:`النسبة`},{body:i(({data:e})=>[f(a(Z(e.commissionPercent))+`%`,1)]),_:1}),l(s(D),{field:`commissionAmount`,header:`المبلغ`},{body:i(({data:e})=>[f(a(s(w)(e.commissionAmount)),1)]),_:1}),l(s(D),{field:`consultantName`,header:`المستشار`}),l(s(D),{field:`accountantName`,header:`المحاسب`}),l(s(D),{header:``,style:{width:`8rem`}},{body:i(({data:e})=>[l(he,{"show-print":``,onEdit:t=>Xe(e),onRemove:t=>$e(e),onPrint:t=>X(e)},null,8,[`onEdit`,`onRemove`,`onPrint`])]),_:1})]),_:1},8,[`value`,`rows`,`total-records`,`first`,`onPage`,`sort-field`,`sort-order`,`onSort`])],64))]),l(s(ie),{visible:H.value,"onUpdate:visible":r[10]||=e=>H.value=e,modal:``,header:W.value?`تعديل وصل نسبة المبيعات`:`وصل نسبة مبيعات جديد`,style:{width:`640px`},breakpoints:{"960px":`95vw`}},{footer:i(()=>[l(s(v),{label:`إلغاء`,severity:`secondary`,text:``,onClick:r[9]||=e=>H.value=!1}),l(s(v),{label:W.value?`حفظ وطباعة`:`إنشاء وطباعة`,icon:`pi pi-print`,loading:U.value,onClick:Qe},null,8,[`label`,`loading`])]),default:i(()=>[g(`div`,k,[s(x).canSelectComplex?(t(),_(`div`,A,[r[12]||=g(`label`,null,`المجمع`,-1),l(s(E),{modelValue:K.complexId,"onUpdate:modelValue":r[3]||=e=>K.complexId=e,options:q.value,"option-label":`label`,"option-value":`id`,placeholder:`اختر المجمع`,class:`w-full`,"append-to":`body`,disabled:!!W.value},null,8,[`modelValue`,`options`,`disabled`])])):d(``,!0),g(`div`,j,[r[13]||=g(`label`,null,`اختيار العقد`,-1),l(s(ge),{modelValue:F.value,"onUpdate:modelValue":r[4]||=e=>F.value=e,suggestions:P.value,"option-label":`contractNumber`,"force-selection":``,dropdown:``,class:`w-full`,placeholder:`ابحث برقم العقد / العميل / الوحدة`,onComplete:Je},{option:i(({option:e})=>[g(`div`,Ce,[g(`strong`,null,a(e.contractNumber),1),g(`span`,null,a(e.customerName)+` — `+a(e.unitNumber||`—`),1)])]),_:1},8,[`modelValue`,`suggestions`])]),g(`div`,we,[r[14]||=g(`label`,null,`اسم العميل`,-1),l(s(y),{"model-value":K.customerName,class:`w-full`,disabled:``},null,8,[`model-value`])]),g(`div`,Te,[r[15]||=g(`label`,null,`رقم الهاتف`,-1),l(s(y),{"model-value":K.customerPhone||`/`,class:`w-full`,disabled:``},null,8,[`model-value`])]),g(`div`,Ee,[r[16]||=g(`label`,null,`نسبة المبيعات %`,-1),l(s(b),{modelValue:K.commissionPercent,"onUpdate:modelValue":r[5]||=e=>K.commissionPercent=e,min:.01,max:100,"min-fraction-digits":0,"max-fraction-digits":2,suffix:` %`,class:`w-full`},null,8,[`modelValue`]),g(`small`,De,`من مبلغ سعر الشقة: `+a(s(w)(K.sellingPrice)),1)]),g(`div`,Oe,[r[17]||=g(`label`,null,`مبلغاً وقدره`,-1),l(s(b),{modelValue:K.commissionAmount,"onUpdate:modelValue":r[6]||=e=>K.commissionAmount=e,min:0,"min-fraction-digits":0,"max-fraction-digits":0,class:`w-full`},null,8,[`modelValue`]),g(`small`,ke,a(Ke.value),1)]),g(`div`,Ae,[r[18]||=g(`label`,null,`تاريخ الوصل`,-1),l(s(ae),{modelValue:G.value,"onUpdate:modelValue":r[7]||=e=>G.value=e,"date-format":`dd/mm/yy`,"show-icon":``,class:`w-full`},null,8,[`modelValue`])]),g(`div`,je,[r[19]||=g(`label`,null,`وذلك عن`,-1),l(s(y),{"model-value":J.value,class:`w-full`,disabled:``},null,8,[`model-value`])]),g(`div`,Me,[r[20]||=g(`label`,null,`مستشار عقاري`,-1),l(s(y),{modelValue:K.consultantName,"onUpdate:modelValue":r[8]||=e=>K.consultantName=e,class:`w-full`,placeholder:`يُدخل يدوياً`},null,8,[`modelValue`])]),g(`div`,Ne,[g(`p`,Pe,a(Ge.value),1)]),g(`div`,Fe,[g(`div`,null,[r[21]||=g(`strong`,null,`زبون`,-1),g(`div`,null,a(K.customerName||`—`),1)]),g(`div`,null,[r[22]||=g(`strong`,null,`محاسب`,-1),g(`div`,null,a(s(x).displayName||`—`),1)])])])]),_:1},8,[`visible`,`header`])]))}}),[[`__scopeId`,`data-v-c6fc4e2e`]]);export{M as default};
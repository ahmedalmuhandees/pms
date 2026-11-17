import{At as e,Ct as t,Kn as n,Ot as r,St as i,Tn as a,Vt as o,Wt as s,_ as c,_t as l,an as u,bt as d,c as f,cn as p,gn as m,kt as h,n as g,pn as _,s as v,t as y,v as b,vn as x,wt as S,xt as C}from"./client-DhidhXbC.js";import{t as w}from"./button-CsBPUHM3.js";import{_ as T,c as ee,g as E,l as te,n as ne}from"./index-Btx2KHWV.js";import{t as D}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{t as O}from"./select-B0DPS95M.js";import{t as re}from"./datepicker-BxROAicC.js";import{n as ie,t as k}from"./column-HBGtX_SE.js";import{r as ae}from"./complexes-DngKYK7Z.js";import{n as oe,t as se}from"./useNotify-DKQQjrk9.js";import{t as ce}from"./FilterBar-BcR-MRib.js";import{t as le}from"./usePagedList-D9DyMtwU.js";import{t as ue}from"./PageHeader-DZkgevaX.js";import{n as de,t as fe}from"./TableSkeleton-C62TsVRe.js";import{t as pe}from"./RowActions-DBU6qCVZ.js";import{t as me}from"./autocomplete-BP60mTYp.js";async function he(e){return v(await y.get(`/api/SalesCommissions`,{params:e}))}async function ge(e,t){return v(await y.get(`/api/SalesCommissions/contracts`,{params:{complexId:e,search:t}}))}async function _e(e){return v(await y.post(`/api/SalesCommissions`,e))}async function ve(e,t){return v(await y.put(`/api/SalesCommissions/${e}`,t))}async function ye(e){return v(await y.delete(`/api/SalesCommissions/${e}`))}var be={class:`page`},xe={class:`data-panel`},Se={class:`form-grid`},A={key:0,class:`field`},j={class:`field`},Ce={class:`contract-opt`},we={class:`field`},Te={class:`field`},Ee={class:`field`},De={class:`hint`},Oe={class:`field`},ke={class:`hint`},Ae={class:`field`},je={class:`field full`},Me={class:`field full`},Ne={class:`field full`},Pe={class:`red-note`},Fe={class:`signs-preview full`},M=D(e({__name:`SalesCommissionsView`,setup(e){let v=ne(),y=oe(),{ask:D}=se(),M=x([]),N=x(v.scopedComplexId),P=x([]),F=x(null),{items:I,loading:Ie,page:Le,pageSize:L,total:Re,search:R,load:z,onSearch:ze,setFilter:B,setSortMode:Be,onTableSort:Ve,sortField:He,sortOrder:Ue,sortMode:V,onLazyPage:We}=le(he),H=x(!1),U=x(!1),W=x(null),G=x(new Date),K=m({complexId:``,salesContractId:``,commissionPercent:2,commissionAmount:0,consultantName:``,customerName:``,customerPhone:``,unitNumber:``,sellingPrice:0}),q=d(()=>f(M.value,e=>e.nameAr||e.name||e.id)),J=d(()=>`عمولة ${Z(K.commissionPercent)}% للشقة رقم ${K.unitNumber||`—`}`),Ge=d(()=>`العمولة الادارية عمولة ${Z(K.commissionPercent)}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`),Ke=d(()=>$(K.commissionAmount));u(()=>[K.commissionPercent,K.sellingPrice],([e,t])=>{t>0&&e>0&&(K.commissionAmount=Math.round(t*e/100))}),u(N,e=>{B(`ComplexId`,e||void 0)});async function qe(){let e=await ae({Page:1,PageSize:200});M.value=e.items??[]}async function Je(e){let t=K.complexId||N.value;if(!t){P.value=[];return}P.value=await ge(t,e.query||void 0)}function Y(e){if(!e||typeof e!=`object`||!(`id`in e)){K.salesContractId=``,K.customerName=``,K.customerPhone=``,K.unitNumber=``,K.sellingPrice=0,K.commissionAmount=0;return}K.salesContractId=e.id,K.complexId=e.complexId,K.customerName=e.customerName,K.customerPhone=e.customerPhone||``,K.unitNumber=e.unitNumber||``,K.sellingPrice=e.sellingPrice,K.commissionPercent>0&&(K.commissionAmount=Math.round(e.sellingPrice*K.commissionPercent/100))}u(F,e=>Y(e));function Ye(){W.value=null,G.value=new Date,F.value=null,Object.assign(K,{complexId:N.value||v.scopedComplexId||``,salesContractId:``,commissionPercent:2,commissionAmount:0,consultantName:``,customerName:``,customerPhone:``,unitNumber:``,sellingPrice:0}),H.value=!0}function Xe(e){W.value=e.id,G.value=e.receiptDate?new Date(e.receiptDate):new Date,F.value={id:e.salesContractId,contractNumber:e.contractNumber||``,customerName:e.customerName,customerPhone:e.customerPhone,unitNumber:e.unitNumber,sellingPrice:e.sellingPrice,complexId:e.complexId},Object.assign(K,{complexId:e.complexId,salesContractId:e.salesContractId,commissionPercent:e.commissionPercent,commissionAmount:e.commissionAmount,consultantName:e.consultantName||``,customerName:e.customerName,customerPhone:e.customerPhone||``,unitNumber:e.unitNumber||``,sellingPrice:e.sellingPrice}),H.value=!0}function Ze(){return{salesContractId:K.salesContractId,complexId:K.complexId,receiptDate:G.value?new Date(G.value.getFullYear(),G.value.getMonth(),G.value.getDate()).toISOString():null,commissionPercent:K.commissionPercent,commissionAmount:K.commissionAmount,description:J.value,consultantName:K.consultantName||null}}async function Qe(){if(!K.complexId||!K.salesContractId){y.warning(`اختر المجمع والعقد`);return}if(!K.commissionPercent||K.commissionPercent<=0){y.warning(`أدخل نسبة المبيعات`);return}U.value=!0;try{let e=Ze(),t=W.value?await ve(W.value,e):await _e(e);y.success(W.value?`تم تحديث الوصل`:`تم إنشاء الوصل`),H.value=!1,await z(),X(t)}catch(e){y.error(g(e))}finally{U.value=!1}}async function $e(e){if(await D(`حذف وصل العمولة رقم ${e.receiptNumber}؟`))try{await ye(e.id),y.success(`تم الحذف`),await z()}catch(e){y.error(g(e))}}function et(e){return M.value.find(t=>t.id===e)}function X(e){let t=et(e.complexId),n=t?.nameAr||e.complexName||`المجمع`,r=t?.name||``,i=t?.logoUrl?ee(t.logoUrl):``,a=[t?.address,t?.city].filter(Boolean).join(` - `)||``,o=tt(e.receiptDate),s=e.receiptNumber?.replace(/^SC-\d+-/,``)||e.receiptNumber,c=`${b(e.commissionAmount)} IQD`,l=$(e.commissionAmount),u=e.customerPhone?.trim()||`/`,d=Z(e.commissionPercent),f=`العمولة الادارية عمولة ${d}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`,p=e.description||`عمولة ${d}% للشقة رقم ${e.unitNumber||`—`}`,m=`<!DOCTYPE html>
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
</html>`,h=window.open(``,`_blank`);if(!h){y.warning(`اسمح بالنوافذ المنبثقة للطباعة`);return}h.document.open(),h.document.write(m),h.document.close()}function Z(e){return e==null||Number.isNaN(e)?`0`:Number.isInteger(e)?String(e):e.toFixed(2).replace(/\.?0+$/,``)}function tt(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:`${String(t.getDate()).padStart(2,`0`)}/${String(t.getMonth()+1).padStart(2,`0`)}/${t.getFullYear()}`}function Q(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function $(e){let t=Math.round(Math.abs(e||0));if(t===0)return`صفر دينار عراقي`;let n=[``,`واحد`,`اثنان`,`ثلاثة`,`أربعة`,`خمسة`,`ستة`,`سبعة`,`ثمانية`,`تسعة`,`عشرة`,`أحد عشر`,`اثنا عشر`,`ثلاثة عشر`,`أربعة عشر`,`خمسة عشر`,`ستة عشر`,`سبعة عشر`,`ثمانية عشر`,`تسعة عشر`],r=[``,``,`عشرون`,`ثلاثون`,`أربعون`,`خمسون`,`ستون`,`سبعون`,`ثمانون`,`تسعون`],i=[``,`مائة`,`مائتان`,`ثلاثمائة`,`أربعمائة`,`خمسمائة`,`ستمائة`,`سبعمائة`,`ثمانمائة`,`تسعمائة`];function a(e){if(e===0)return``;if(e<20)return n[e];if(e<100){let t=Math.floor(e/10),i=e%10;return i?`${n[i]} و${r[t]}`:r[t]}let t=Math.floor(e/100),o=e%100;return o?`${i[t]} و${a(o)}`:i[t]}let o=[],s=Math.floor(t/1e6),c=Math.floor(t%1e6/1e3),l=t%1e3;return s&&(s===1?o.push(`مليون`):s===2?o.push(`مليونان`):s>=3&&s<=10?o.push(`${a(s)} ملايين`):o.push(`${a(s)} مليون`)),c&&(c===1?o.push(`ألف`):c===2?o.push(`ألفان`):c>=3&&c<=10?o.push(`${a(c)} آلاف`):o.push(`${a(c)} ألف`)),l&&o.push(a(l)),`${o.join(` و`)} دينار عراقي`}return o(async()=>{try{await qe(),N.value||=v.scopedComplexId||M.value[0]?.id||null,N.value?B(`ComplexId`,N.value):await z()}catch(e){y.error(g(e))}}),(e,o)=>(s(),S(`div`,be,[h(ue,{title:`نسبة المبيعات`,subtitle:`وصولات عمولة المبيعات وطباعتها`},{actions:p(()=>[h(a(w),{label:`وصل جديد`,icon:`pi pi-plus`,onClick:Ye})]),_:1}),C(`div`,xe,[h(ce,{search:a(R),"onUpdate:search":o[1]||=e=>_(R)?R.value=e:null,placeholder:`بحث برقم الوصل / العميل / الوحدة`,onSearch:a(ze),"sort-mode":a(V),"onUpdate:sortMode":o[2]||=e=>_(V)?V.value=e:null,onSortChange:a(Be)},{default:p(()=>[a(v).canSelectComplex?(s(),i(a(O),{key:0,modelValue:N.value,"onUpdate:modelValue":o[0]||=e=>N.value=e,options:q.value,"option-label":`label`,"option-value":`id`,placeholder:`المجمع`,"show-clear":``,"append-to":`body`},null,8,[`modelValue`,`options`])):t(``,!0)]),_:1},8,[`search`,`onSearch`,`sort-mode`,`onSortChange`]),a(Ie)&&!a(I).length?(s(),i(fe,{key:0})):(s(),S(l,{key:1},[h(de,{"sort-mode":a(V)},null,8,[`sort-mode`]),h(a(ie),{value:a(I),lazy:!0,paginator:!0,rows:a(L),"total-records":a(Re),first:(a(Le)-1)*a(L),"data-key":`id`,"striped-rows":``,onPage:a(We),"sort-mode":`single`,"sort-field":a(He),"sort-order":a(Ue),"removable-sort":``,onSort:a(Ve)},{empty:p(()=>[...o[11]||=[C(`div`,{class:`empty-box`},`لا توجد وصولات عمولة`,-1)]]),default:p(()=>[h(a(k),{field:`receiptNumber`,header:`رقم الوصل`,sortable:``}),h(a(k),{field:`receiptDate`,header:`التاريخ`,sortable:``},{body:p(({data:e})=>[r(n(a(c)(e.receiptDate)),1)]),_:1}),h(a(k),{field:`customerName`,header:`العميل`}),h(a(k),{field:`unitNumber`,header:`الوحدة`}),h(a(k),{field:`commissionPercent`,header:`النسبة`},{body:p(({data:e})=>[r(n(Z(e.commissionPercent))+`%`,1)]),_:1}),h(a(k),{field:`commissionAmount`,header:`المبلغ`},{body:p(({data:e})=>[r(n(a(b)(e.commissionAmount)),1)]),_:1}),h(a(k),{field:`consultantName`,header:`المستشار`}),h(a(k),{field:`accountantName`,header:`المحاسب`}),h(a(k),{header:``,style:{width:`8rem`}},{body:p(({data:e})=>[h(pe,{"show-print":``,onEdit:t=>Xe(e),onRemove:t=>$e(e),onPrint:t=>X(e)},null,8,[`onEdit`,`onRemove`,`onPrint`])]),_:1})]),_:1},8,[`value`,`rows`,`total-records`,`first`,`onPage`,`sort-field`,`sort-order`,`onSort`])],64))]),h(a(te),{visible:H.value,"onUpdate:visible":o[10]||=e=>H.value=e,modal:``,header:W.value?`تعديل وصل نسبة المبيعات`:`وصل نسبة مبيعات جديد`,style:{width:`640px`},breakpoints:{"960px":`95vw`}},{footer:p(()=>[h(a(w),{label:`إلغاء`,severity:`secondary`,text:``,onClick:o[9]||=e=>H.value=!1}),h(a(w),{label:W.value?`حفظ وطباعة`:`إنشاء وطباعة`,icon:`pi pi-print`,loading:U.value,onClick:Qe},null,8,[`label`,`loading`])]),default:p(()=>[C(`div`,Se,[a(v).canSelectComplex?(s(),S(`div`,A,[o[12]||=C(`label`,null,`المجمع`,-1),h(a(O),{modelValue:K.complexId,"onUpdate:modelValue":o[3]||=e=>K.complexId=e,options:q.value,"option-label":`label`,"option-value":`id`,placeholder:`اختر المجمع`,class:`w-full`,"append-to":`body`,disabled:!!W.value},null,8,[`modelValue`,`options`,`disabled`])])):t(``,!0),C(`div`,j,[o[13]||=C(`label`,null,`اختيار العقد`,-1),h(a(me),{modelValue:F.value,"onUpdate:modelValue":o[4]||=e=>F.value=e,suggestions:P.value,"option-label":`contractNumber`,"force-selection":``,dropdown:``,class:`w-full`,placeholder:`ابحث برقم العقد / العميل / الوحدة`,onComplete:Je},{option:p(({option:e})=>[C(`div`,Ce,[C(`strong`,null,n(e.contractNumber),1),C(`span`,null,n(e.customerName)+` — `+n(e.unitNumber||`—`),1)])]),_:1},8,[`modelValue`,`suggestions`])]),C(`div`,we,[o[14]||=C(`label`,null,`اسم العميل`,-1),h(a(T),{"model-value":K.customerName,class:`w-full`,disabled:``},null,8,[`model-value`])]),C(`div`,Te,[o[15]||=C(`label`,null,`رقم الهاتف`,-1),h(a(T),{"model-value":K.customerPhone||`/`,class:`w-full`,disabled:``},null,8,[`model-value`])]),C(`div`,Ee,[o[16]||=C(`label`,null,`نسبة المبيعات %`,-1),h(a(E),{modelValue:K.commissionPercent,"onUpdate:modelValue":o[5]||=e=>K.commissionPercent=e,min:.01,max:100,"min-fraction-digits":0,"max-fraction-digits":2,suffix:` %`,class:`w-full`},null,8,[`modelValue`]),C(`small`,De,`من مبلغ سعر الشقة: `+n(a(b)(K.sellingPrice)),1)]),C(`div`,Oe,[o[17]||=C(`label`,null,`مبلغاً وقدره`,-1),h(a(E),{modelValue:K.commissionAmount,"onUpdate:modelValue":o[6]||=e=>K.commissionAmount=e,min:0,"min-fraction-digits":0,"max-fraction-digits":0,class:`w-full`},null,8,[`modelValue`]),C(`small`,ke,n(Ke.value),1)]),C(`div`,Ae,[o[18]||=C(`label`,null,`تاريخ الوصل`,-1),h(a(re),{modelValue:G.value,"onUpdate:modelValue":o[7]||=e=>G.value=e,"date-format":`dd/mm/yy`,"show-icon":``,class:`w-full`},null,8,[`modelValue`])]),C(`div`,je,[o[19]||=C(`label`,null,`وذلك عن`,-1),h(a(T),{"model-value":J.value,class:`w-full`,disabled:``},null,8,[`model-value`])]),C(`div`,Me,[o[20]||=C(`label`,null,`مستشار عقاري`,-1),h(a(T),{modelValue:K.consultantName,"onUpdate:modelValue":o[8]||=e=>K.consultantName=e,class:`w-full`,placeholder:`يُدخل يدوياً`},null,8,[`modelValue`])]),C(`div`,Ne,[C(`p`,Pe,n(Ge.value),1)]),C(`div`,Fe,[C(`div`,null,[o[21]||=C(`strong`,null,`زبون`,-1),C(`div`,null,n(K.customerName||`—`),1)]),C(`div`,null,[o[22]||=C(`strong`,null,`محاسب`,-1),C(`div`,null,n(a(v).displayName||`—`),1)])])])]),_:1},8,[`visible`,`header`])]))}}),[[`__scopeId`,`data-v-c6fc4e2e`]]);export{M as default};
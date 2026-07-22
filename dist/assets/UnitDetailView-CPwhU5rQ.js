import{C as e,Dn as t,Ft as n,In as r,Jt as i,K as a,On as o,Vn as s,W as c,Wt as l,Xt as u,Y as d,Yt as f,Z as p,Zt as m,_n as h,_t as g,a as _,at as v,bn as y,c as ee,fn as te,gn as b,h as ne,ht as x,ir as S,j as C,l as w,m as re,mn as T,n as E,nn as D,qt as ie,rn as O,t as k,tn as A,tr as j,u as M,un as N,vt as P,x as F,yn as I,z as L}from"./client-ByQROz3u.js";import{f as R,i as z,t as B}from"./button-CaKkucmT.js";import{c as ae,n as V,s as oe}from"./index-DvoVj-d9.js";import{t as H}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{n as U}from"./overlayeventbus-B1Yh7vuD.js";import{r as se,t as W}from"./chevronright-ColzKQYb.js";import{n as ce,t as G}from"./column-7sy44qyy.js";import{n as le,t as ue}from"./useNotify-CSwD6aEC.js";import{n as de,t as K}from"./skeleton-B37R5_d9.js";import{t as q}from"./chevronleft-CXemo7QX.js";import{r as fe}from"./units-nH9E8AdY.js";var J=e.extend({name:`tabs`,style:`
    .p-tabs {
        display: flex;
        flex-direction: column;
    }

    .p-tablist {
        display: flex;
        position: relative;
        overflow: hidden;
        background: dt('tabs.tablist.background');
    }

    .p-tablist-viewport {
        overflow-x: auto;
        overflow-y: hidden;
        scroll-behavior: smooth;
        scrollbar-width: none;
        overscroll-behavior: contain auto;
    }

    .p-tablist-viewport::-webkit-scrollbar {
        display: none;
    }

    .p-tablist-tab-list {
        position: relative;
        display: flex;
        border-style: solid;
        border-color: dt('tabs.tablist.border.color');
        border-width: dt('tabs.tablist.border.width');
    }

    .p-tablist-content {
        flex-grow: 1;
    }

    .p-tablist-nav-button {
        all: unset;
        position: absolute !important;
        flex-shrink: 0;
        inset-block-start: 0;
        z-index: 2;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: dt('tabs.nav.button.background');
        color: dt('tabs.nav.button.color');
        width: dt('tabs.nav.button.width');
        transition:
            color dt('tabs.transition.duration'),
            outline-color dt('tabs.transition.duration'),
            box-shadow dt('tabs.transition.duration');
        box-shadow: dt('tabs.nav.button.shadow');
        outline-color: transparent;
        cursor: pointer;
    }

    .p-tablist-nav-button:focus-visible {
        z-index: 1;
        box-shadow: dt('tabs.nav.button.focus.ring.shadow');
        outline: dt('tabs.nav.button.focus.ring.width') dt('tabs.nav.button.focus.ring.style') dt('tabs.nav.button.focus.ring.color');
        outline-offset: dt('tabs.nav.button.focus.ring.offset');
    }

    .p-tablist-nav-button:hover {
        color: dt('tabs.nav.button.hover.color');
    }

    .p-tablist-prev-button {
        inset-inline-start: 0;
    }

    .p-tablist-next-button {
        inset-inline-end: 0;
    }

    .p-tablist-prev-button:dir(rtl),
    .p-tablist-next-button:dir(rtl) {
        transform: rotate(180deg);
    }

    .p-tab {
        flex-shrink: 0;
        cursor: pointer;
        user-select: none;
        position: relative;
        border-style: solid;
        white-space: nowrap;
        gap: dt('tabs.tab.gap');
        background: dt('tabs.tab.background');
        border-width: dt('tabs.tab.border.width');
        border-color: dt('tabs.tab.border.color');
        color: dt('tabs.tab.color');
        padding: dt('tabs.tab.padding');
        font-weight: dt('tabs.tab.font.weight');
        transition:
            background dt('tabs.transition.duration'),
            border-color dt('tabs.transition.duration'),
            color dt('tabs.transition.duration'),
            outline-color dt('tabs.transition.duration'),
            box-shadow dt('tabs.transition.duration');
        margin: dt('tabs.tab.margin');
        outline-color: transparent;
    }

    .p-tab:not(.p-disabled):focus-visible {
        z-index: 1;
        box-shadow: dt('tabs.tab.focus.ring.shadow');
        outline: dt('tabs.tab.focus.ring.width') dt('tabs.tab.focus.ring.style') dt('tabs.tab.focus.ring.color');
        outline-offset: dt('tabs.tab.focus.ring.offset');
    }

    .p-tab:not(.p-tab-active):not(.p-disabled):hover {
        background: dt('tabs.tab.hover.background');
        border-color: dt('tabs.tab.hover.border.color');
        color: dt('tabs.tab.hover.color');
    }

    .p-tab-active {
        background: dt('tabs.tab.active.background');
        border-color: dt('tabs.tab.active.border.color');
        color: dt('tabs.tab.active.color');
    }

    .p-tabpanels {
        background: dt('tabs.tabpanel.background');
        color: dt('tabs.tabpanel.color');
        padding: dt('tabs.tabpanel.padding');
        outline: 0 none;
    }

    .p-tabpanel:focus-visible {
        box-shadow: dt('tabs.tabpanel.focus.ring.shadow');
        outline: dt('tabs.tabpanel.focus.ring.width') dt('tabs.tabpanel.focus.ring.style') dt('tabs.tabpanel.focus.ring.color');
        outline-offset: dt('tabs.tabpanel.focus.ring.offset');
    }

    .p-tablist-active-bar {
        z-index: 1;
        display: block;
        position: absolute;
        inset-block-end: dt('tabs.active.bar.bottom');
        height: dt('tabs.active.bar.height');
        background: dt('tabs.active.bar.background');
        transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
    }
`,classes:{root:function(e){return[`p-tabs p-component`,{"p-tabs-scrollable":e.props.scrollable}]}}}),Y={name:`Tabs`,extends:{name:`BaseTabs`,extends:F,props:{value:{type:[String,Number],default:void 0},lazy:{type:Boolean,default:!1},scrollable:{type:Boolean,default:!1},showNavigators:{type:Boolean,default:!0},tabindex:{type:Number,default:0},selectOnFocus:{type:Boolean,default:!1}},style:J,provide:function(){return{$pcTabs:this,$parentInstance:this}}},inheritAttrs:!1,emits:[`update:value`],data:function(){return{d_value:this.value}},watch:{value:function(e){this.d_value=e}},methods:{updateValue:function(e){this.d_value!==e&&(this.d_value=e,this.$emit(`update:value`,e))},isVertical:function(){return this.orientation===`vertical`}}};function X(e,t,n,r,i,a){return T(),m(`div`,N({class:e.cx(`root`)},e.ptmi(`root`)),[h(e.$slots,`default`)],16)}Y.render=X;var Z={name:`TabList`,extends:{name:`BaseTabList`,extends:F,props:{},style:e.extend({name:`tablist`,classes:{root:`p-tablist`,content:`p-tablist-content p-tablist-viewport`,tabList:`p-tablist-tab-list`,activeBar:`p-tablist-active-bar`,prevButton:`p-tablist-prev-button p-tablist-nav-button`,nextButton:`p-tablist-next-button p-tablist-nav-button`}}),provide:function(){return{$pcTabList:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`],data:function(){return{isPrevButtonEnabled:!1,isNextButtonEnabled:!0}},resizeObserver:void 0,watch:{showNavigators:function(e){e?this.bindResizeObserver():this.unbindResizeObserver()},activeValue:{flush:`post`,handler:function(){this.updateInkBar()}}},mounted:function(){var e=this;setTimeout(function(){e.updateInkBar()},150),this.showNavigators&&(this.updateButtonState(),this.bindResizeObserver())},updated:function(){this.showNavigators&&this.updateButtonState()},beforeUnmount:function(){this.unbindResizeObserver()},methods:{onScroll:function(e){this.showNavigators&&this.updateButtonState(),e.preventDefault()},onPrevButtonClick:function(){var e=this.$refs.content,t=this.getVisibleButtonWidths(),n=a(e)-t,r=Math.abs(e.scrollLeft)-n*.8,i=Math.max(r,0);e.scrollLeft=p(e)?-1*i:i},onNextButtonClick:function(){var e=this.$refs.content,t=this.getVisibleButtonWidths(),n=a(e)-t,r=Math.abs(e.scrollLeft)+n*.8,i=e.scrollWidth-n,o=Math.min(r,i);e.scrollLeft=p(e)?-1*o:o},bindResizeObserver:function(){var e=this;this.resizeObserver=new ResizeObserver(function(){return e.updateButtonState()}),this.resizeObserver.observe(this.$refs.list)},unbindResizeObserver:function(){var e;(e=this.resizeObserver)==null||e.unobserve(this.$refs.list),this.resizeObserver=void 0},updateInkBar:function(){var e=this.$refs,t=e.content,n=e.inkbar,r=e.tabs;if(n){var i=g(t,`[data-pc-name="tab"][data-p-active="true"]`);this.$pcTabs.isVertical()?(n.style.height=C(i)+`px`,n.style.top=L(i).top-L(r).top+`px`):(n.style.width=x(i)+`px`,n.style.left=L(i).left-L(r).left+`px`)}},updateButtonState:function(){var e=this.$refs,t=e.list,n=e.content,r=n.scrollTop,i=n.scrollWidth,o=n.scrollHeight,s=n.offsetWidth,c=n.offsetHeight,l=Math.abs(n.scrollLeft),u=[a(n),d(n)],f=u[0],p=u[1];this.$pcTabs.isVertical()?(this.isPrevButtonEnabled=r!==0,this.isNextButtonEnabled=t.offsetHeight>=c&&parseInt(r)!==o-p):(this.isPrevButtonEnabled=l!==0,this.isNextButtonEnabled=t.offsetWidth>=s&&parseInt(l)!==i-f)},getVisibleButtonWidths:function(){var e=this.$refs,t=e.prevButton,n=e.nextButton,r=0;return this.showNavigators&&(r=(t?.offsetWidth||0)+(n?.offsetWidth||0)),r}},computed:{templates:function(){return this.$pcTabs.$slots},activeValue:function(){return this.$pcTabs.d_value},showNavigators:function(){return this.$pcTabs.showNavigators},prevButtonAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.previous:void 0},nextButtonAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.next:void 0},dataP:function(){return P({scrollable:this.$pcTabs.scrollable})}},components:{ChevronLeftIcon:q,ChevronRightIcon:W},directives:{ripple:z}},pe=[`data-p`],me=[`aria-label`,`tabindex`],he=[`data-p`],ge=[`aria-orientation`],_e=[`aria-label`,`tabindex`];function ve(e,t,n,r,a,s){var c=I(`ripple`);return T(),m(`div`,N({ref:`list`,class:e.cx(`root`),"data-p":s.dataP},e.ptmi(`root`)),[s.showNavigators&&a.isPrevButtonEnabled?o((T(),m(`button`,N({key:0,ref:`prevButton`,type:`button`,class:e.cx(`prevButton`),"aria-label":s.prevButtonAriaLabel,tabindex:s.$pcTabs.tabindex,onClick:t[0]||=function(){return s.onPrevButtonClick&&s.onPrevButtonClick.apply(s,arguments)}},e.ptm(`prevButton`),{"data-pc-group-section":`navigator`}),[(T(),f(y(s.templates.previcon||`ChevronLeftIcon`),N({"aria-hidden":`true`},e.ptm(`prevIcon`)),null,16))],16,me)),[[c]]):u(``,!0),i(`div`,N({ref:`content`,class:e.cx(`content`),onScroll:t[1]||=function(){return s.onScroll&&s.onScroll.apply(s,arguments)},"data-p":s.dataP},e.ptm(`content`)),[i(`div`,N({ref:`tabs`,class:e.cx(`tabList`),role:`tablist`,"aria-orientation":s.$pcTabs.orientation||`horizontal`},e.ptm(`tabList`)),[h(e.$slots,`default`),i(`span`,N({ref:`inkbar`,class:e.cx(`activeBar`),role:`presentation`,"aria-hidden":`true`},e.ptm(`activeBar`)),null,16)],16,ge)],16,he),s.showNavigators&&a.isNextButtonEnabled?o((T(),m(`button`,N({key:1,ref:`nextButton`,type:`button`,class:e.cx(`nextButton`),"aria-label":s.nextButtonAriaLabel,tabindex:s.$pcTabs.tabindex,onClick:t[2]||=function(){return s.onNextButtonClick&&s.onNextButtonClick.apply(s,arguments)}},e.ptm(`nextButton`),{"data-pc-group-section":`navigator`}),[(T(),f(y(s.templates.nexticon||`ChevronRightIcon`),N({"aria-hidden":`true`},e.ptm(`nextIcon`)),null,16))],16,_e)),[[c]]):u(``,!0)],16,pe)}Z.render=ve;var ye=e.extend({name:`tab`,classes:{root:function(e){var t=e.instance,n=e.props;return[`p-tab`,{"p-tab-active":t.active,"p-disabled":n.disabled}]}}}),Q={name:`Tab`,extends:{name:`BaseTab`,extends:F,props:{value:{type:[String,Number],default:void 0},disabled:{type:Boolean,default:!1},as:{type:[String,Object],default:`BUTTON`},asChild:{type:Boolean,default:!1}},style:ye,provide:function(){return{$pcTab:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`,`$pcTabList`],methods:{onFocus:function(){this.$pcTabs.selectOnFocus&&this.changeActiveValue()},onClick:function(){this.changeActiveValue()},onKeydown:function(e){switch(e.code){case`ArrowRight`:this.onArrowRightKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:case`Space`:this.onEnterKey(e);break}},onArrowRightKey:function(e){var t=this.findNextTab(e.currentTarget);t?this.changeFocusedTab(e,t):this.onHomeKey(e),e.preventDefault()},onArrowLeftKey:function(e){var t=this.findPrevTab(e.currentTarget);t?this.changeFocusedTab(e,t):this.onEndKey(e),e.preventDefault()},onHomeKey:function(e){var t=this.findFirstTab();this.changeFocusedTab(e,t),e.preventDefault()},onEndKey:function(e){var t=this.findLastTab();this.changeFocusedTab(e,t),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.findLastTab()),e.preventDefault()},onPageUpKey:function(e){this.scrollInView(this.findFirstTab()),e.preventDefault()},onEnterKey:function(e){this.changeActiveValue()},findNextTab:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1]?e:e.nextElementSibling;return t?c(t,`data-p-disabled`)||c(t,`data-pc-section`)===`activebar`?this.findNextTab(t):g(t,`[data-pc-name="tab"]`):null},findPrevTab:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1]?e:e.previousElementSibling;return t?c(t,`data-p-disabled`)||c(t,`data-pc-section`)===`activebar`?this.findPrevTab(t):g(t,`[data-pc-name="tab"]`):null},findFirstTab:function(){return this.findNextTab(this.$pcTabList.$refs.tabs.firstElementChild,!0)},findLastTab:function(){return this.findPrevTab(this.$pcTabList.$refs.tabs.lastElementChild,!0)},changeActiveValue:function(){this.$pcTabs.updateValue(this.value)},changeFocusedTab:function(e,t){v(t),this.scrollInView(t)},scrollInView:function(e){var t;e==null||(t=e.scrollIntoView)==null||t.call(e,{block:`nearest`})}},computed:{active:function(){return n(this.$pcTabs?.d_value,this.value)},id:function(){return`${this.$pcTabs?.$id}_tab_${this.value}`},ariaControls:function(){return`${this.$pcTabs?.$id}_tabpanel_${this.value}`},attrs:function(){return N(this.asAttrs,this.a11yAttrs,this.ptmi(`root`,this.ptParams))},asAttrs:function(){return this.as===`BUTTON`?{type:`button`,disabled:this.disabled}:void 0},a11yAttrs:function(){return{id:this.id,tabindex:this.active?this.$pcTabs.tabindex:-1,role:`tab`,"aria-selected":this.active,"aria-controls":this.ariaControls,"data-pc-name":`tab`,"data-p-disabled":this.disabled,"data-p-active":this.active,onFocus:this.onFocus,onKeydown:this.onKeydown}},ptParams:function(){return{context:{active:this.active}}},dataP:function(){return P({active:this.active})}},directives:{ripple:z}};function be(e,n,r,i,a,s){var c=I(`ripple`);return e.asChild?h(e.$slots,`default`,{key:1,dataP:s.dataP,class:j(e.cx(`root`)),active:s.active,a11yAttrs:s.a11yAttrs,onClick:s.onClick}):o((T(),f(y(e.as),N({key:0,class:e.cx(`root`),"data-p":s.dataP,onClick:s.onClick},s.attrs),{default:t(function(){return[h(e.$slots,`default`)]}),_:3},16,[`class`,`data-p`,`onClick`])),[[c]])}Q.render=be;var xe={name:`TabPanels`,extends:{name:`BaseTabPanels`,extends:F,props:{},style:e.extend({name:`tabpanels`,classes:{root:`p-tabpanels`}}),provide:function(){return{$pcTabPanels:this,$parentInstance:this}}},inheritAttrs:!1};function Se(e,t,n,r,i,a){return T(),m(`div`,N({class:e.cx(`root`),role:`presentation`},e.ptmi(`root`)),[h(e.$slots,`default`)],16)}xe.render=Se;var Ce=e.extend({name:`tabpanel`,classes:{root:function(e){return[`p-tabpanel`,{"p-tabpanel-active":e.instance.active}]}}}),$={name:`TabPanel`,extends:{name:`BaseTabPanel`,extends:F,props:{value:{type:[String,Number],default:void 0},as:{type:[String,Object],default:`DIV`},asChild:{type:Boolean,default:!1},header:null,headerStyle:null,headerClass:null,headerProps:null,headerActionProps:null,contentStyle:null,contentClass:null,contentProps:null,disabled:Boolean},style:Ce,provide:function(){return{$pcTabPanel:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`],computed:{active:function(){return n(this.$pcTabs?.d_value,this.value)},id:function(){return`${this.$pcTabs?.$id}_tabpanel_${this.value}`},ariaLabelledby:function(){return`${this.$pcTabs?.$id}_tab_${this.value}`},attrs:function(){return N(this.a11yAttrs,this.ptmi(`root`,this.ptParams))},a11yAttrs:function(){return{id:this.id,tabindex:this.$pcTabs?.tabindex,role:`tabpanel`,"aria-labelledby":this.ariaLabelledby,"data-pc-name":`tabpanel`,"data-p-active":this.active}},ptParams:function(){return{context:{active:this.active}}}}};function we(e,n,r,i,a,s){var c,d;return s.$pcTabs?(T(),m(l,{key:1},[e.asChild?h(e.$slots,`default`,{key:1,class:j(e.cx(`root`)),active:s.active,a11yAttrs:s.a11yAttrs}):(T(),m(l,{key:0},[!((c=s.$pcTabs)!=null&&c.lazy)||s.active?o((T(),f(y(e.as),N({key:0,class:e.cx(`root`)},s.attrs),{default:t(function(){return[h(e.$slots,`default`)]}),_:3},16,[`class`])),[[R,(d=s.$pcTabs)!=null&&d.lazy?!0:s.active]]):u(``,!0)],64))],64)):h(e.$slots,`default`,{key:0})}$.render=we;async function Te(e,t){return _(await k.get(`/api/units/${e}/images`,{params:t}))}async function Ee(e,t,n=0){let r=new FormData;return r.append(`file`,t),r.append(`SortOrder`,String(n)),_(await k.post(`/api/units/${e}/images`,r,{headers:{"Content-Type":`multipart/form-data`}}))}async function De(e,t,n){return _(await k.put(`/api/units/${e}/images/${t}`,{sortOrder:n}))}async function Oe(e,t){return _(await k.delete(`/api/units/${e}/images/${t}`))}async function ke(e,t){return _(await k.get(`/api/units/${e}/documents`,{params:t}))}async function Ae(e,t,n){let r=new FormData;return r.append(`file`,t),r.append(`Title`,n),_(await k.post(`/api/units/${e}/documents`,r,{headers:{"Content-Type":`multipart/form-data`}}))}async function je(e,t,n){return _(await k.put(`/api/units/${e}/documents/${t}`,{title:n}))}async function Me(e,t){return _(await k.delete(`/api/units/${e}/documents/${t}`))}var Ne={class:`detail-skeleton`,"aria-busy":`true`,"aria-label":`جاري التحميل`},Pe={class:`detail-skeleton__header`},Fe={class:`detail-skeleton__grid`},Ie={class:`detail-skeleton__tabs`},Le={class:`detail-skeleton__media`},Re=H(O({__name:`DetailSkeleton`,setup(e){return(e,t)=>(T(),m(`div`,Ne,[i(`div`,Pe,[D(s(K),{width:`10rem`,height:`1.5rem`,"border-radius":`8px`}),D(s(K),{width:`16rem`,height:`0.85rem`,"border-radius":`8px`,class:`mt-sm`})]),i(`div`,Fe,[(T(),m(l,null,b(8,e=>i(`div`,{key:e,class:`detail-skeleton__cell`},[D(s(K),{width:`4.5rem`,height:`0.7rem`,"border-radius":`6px`}),D(s(K),{width:`70%`,height:`1rem`,"border-radius":`8px`,class:`mt-sm`})])),64))]),i(`div`,Ie,[D(s(K),{width:`6rem`,height:`2.2rem`,"border-radius":`10px`}),D(s(K),{width:`6rem`,height:`2.2rem`,"border-radius":`10px`})]),i(`div`,Le,[(T(),m(l,null,b(4,e=>D(s(K),{key:e,height:`8.5rem`,"border-radius":`14px`})),64))])]))}}),[[`__scopeId`,`data-v-0ac05a1e`]]),ze={class:`page`},Be={key:1,class:`data-panel`},Ve={class:`detail-grid`},He={class:`detail-item`},Ue={class:`detail-value`},We={class:`detail-item`},Ge={class:`detail-value`},Ke={class:`detail-item`},qe={class:`detail-value`},Je={class:`detail-item`},Ye={class:`detail-value`},Xe={class:`detail-item`},Ze={class:`detail-value`},Qe={class:`detail-item`},$e={class:`detail-value`},et={class:`detail-item`},tt={class:`detail-value`},nt={class:`detail-item`},rt={class:`detail-value`},it={class:`detail-item`},at={class:`detail-value`},ot={class:`detail-item full`},st={class:`detail-value`},ct={key:2,class:`data-panel media-panel`},lt={class:`tab-label`},ut={class:`tab-count`},dt={class:`tab-label`},ft={class:`tab-count`},pt={class:`media-toolbar`},mt={key:0,class:`media-grid`},ht={class:`media-thumb`},gt=[`src`,`alt`],_t={class:`sort-badge`},vt={class:`media-body`},yt={class:`media-date`},bt={class:`row-actions`},xt=[`onClick`],St=[`onClick`],Ct={key:1,class:`empty-box`},wt={class:`doc-upload-bar`},Tt={key:0,class:`file-name`},Et=[`href`],Dt={key:1},Ot={class:`row-actions`},kt=[`onClick`],At=[`onClick`],jt={class:`field`},Mt={class:`dialog-actions`},Nt={class:`field`},Pt={class:`dialog-actions`},Ft=H(O({__name:`UnitDetailView`,setup(e){let n=oe(),a=ae(),c=le(),{ask:d}=ue(),p=ie(()=>String(n.params.id)),h=r(!0),g=r(null),_=r([]),v=r([]),y=r(`images`),x=r(!1),C=r(!1),O=r(``),k=r(null),j=r(!1),N=r(!1),P=r(!1),F=r(null),L=r(null),R=r(0),z=r(``),H=r(null),W=r(null);function K(e){return e?e.startsWith(`http`)?e:`${`https://pmsaas-api.execute-iq.com`.replace(/\/$/,``)}/${e.replace(/^\//,``)}`:``}async function q(){let e=await Te(p.value,{Page:1,PageSize:100});_.value=e.items??[]}async function J(){let e=await ke(p.value,{Page:1,PageSize:100});v.value=e.items??[]}async function X(){h.value=!0;try{let[e]=await Promise.all([fe(p.value),q(),J()]);g.value=e}catch(e){c.error(E(e))}finally{h.value=!1}}function pe(){H.value?.click()}async function me(e){let t=e.target,n=t.files?.[0];if(t.value=``,n){x.value=!0;try{let e=_.value.length;await Ee(p.value,n,e),c.success(`تم رفع الصورة بنجاح`),await q()}catch(e){c.error(E(e))}finally{x.value=!1}}}function he(e){F.value=e,R.value=e.sortOrder,j.value=!0}async function ge(){if(F.value){P.value=!0;try{await De(p.value,F.value.id,R.value),c.success(`تم تحديث ترتيب الصورة`),j.value=!1,await q()}catch(e){c.error(E(e))}finally{P.value=!1}}}async function _e(e){if(await d(`حذف هذه الصورة نهائياً؟`,`تأكيد الحذف`))try{await Oe(p.value,e.id),c.success(`تم حذف الصورة`),_.value=_.value.filter(t=>t.id!==e.id)}catch(e){c.error(E(e))}}function ve(){W.value?.click()}function ye(e){let t=e.target,n=t.files?.[0];t.value=``,n&&(k.value=n,O.value.trim()||(O.value=n.name.replace(/\.[^.]+$/,``)))}async function be(){if(!k.value){c.warning(`اختر ملفاً أولاً`);return}if(!O.value.trim()){c.warning(`أدخل عنوان المستند`);return}C.value=!0;try{await Ae(p.value,k.value,O.value.trim()),c.success(`تم رفع المستند بنجاح`),O.value=``,k.value=null,await J()}catch(e){c.error(E(e))}finally{C.value=!1}}function Se(e){L.value=e,z.value=e.title||``,N.value=!0}async function Ce(){if(L.value){if(!z.value.trim()){c.warning(`أدخل عنوان المستند`);return}P.value=!0;try{await je(p.value,L.value.id,z.value.trim()),c.success(`تم تحديث عنوان المستند`),N.value=!1,await J()}catch(e){c.error(E(e))}finally{P.value=!1}}}async function we(e){if(await d(`حذف المستند "${e.title||`بدون عنوان`}"؟`,`تأكيد الحذف`))try{await Me(p.value,e.id),c.success(`تم حذف المستند`),v.value=v.value.filter(t=>t.id!==e.id)}catch(e){c.error(E(e))}}return te(()=>void X()),(e,n)=>{let r=I(`tooltip`);return T(),m(`div`,ze,[D(de,{title:`تفاصيل الوحدة ${g.value?.unitNumber||``}`,subtitle:`بيانات الوحدة مع إدارة الصور والمستندات`},{actions:t(()=>[D(s(B),{label:`العودة إلى الوحدات`,icon:`pi pi-arrow-right`,severity:`secondary`,outlined:``,onClick:n[0]||=e=>s(a).push(`/units`)})]),_:1},8,[`title`]),h.value?(T(),f(Re,{key:0})):g.value?(T(),m(`div`,Be,[i(`div`,Ve,[i(`div`,He,[n[9]||=i(`span`,{class:`detail-label`},`رقم الوحدة`,-1),i(`span`,Ue,S(g.value.unitNumber),1)]),i(`div`,We,[n[10]||=i(`span`,{class:`detail-label`},`النوع`,-1),i(`span`,Ge,S(s(M)(s(ne),g.value.unitType)),1)]),i(`div`,Ke,[n[11]||=i(`span`,{class:`detail-label`},`الحالة`,-1),i(`span`,qe,S(s(M)(s(re),g.value.status)),1)]),i(`div`,Je,[n[12]||=i(`span`,{class:`detail-label`},`المساحة`,-1),i(`span`,Ye,S(g.value.area),1)]),i(`div`,Xe,[n[13]||=i(`span`,{class:`detail-label`},`غرف النوم`,-1),i(`span`,Ze,S(g.value.bedrooms),1)]),i(`div`,Qe,[n[14]||=i(`span`,{class:`detail-label`},`الحمامات`,-1),i(`span`,$e,S(g.value.bathrooms),1)]),i(`div`,et,[n[15]||=i(`span`,{class:`detail-label`},`السعر`,-1),i(`span`,tt,S(s(w)(g.value.price)),1)]),i(`div`,nt,[n[16]||=i(`span`,{class:`detail-label`},`التكلفة`,-1),i(`span`,rt,S(s(w)(g.value.cost)),1)]),i(`div`,it,[n[17]||=i(`span`,{class:`detail-label`},`الاتجاه`,-1),i(`span`,at,S(g.value.direction||`—`),1)]),i(`div`,ot,[n[18]||=i(`span`,{class:`detail-label`},`ملاحظات`,-1),i(`span`,st,S(g.value.notes||`—`),1)])])])):u(``,!0),h.value?u(``,!0):(T(),m(`div`,ct,[D(s(Y),{value:y.value,"onUpdate:value":n[2]||=e=>y.value=e},{default:t(()=>[D(s(Z),null,{default:t(()=>[D(s(Q),{value:`images`},{default:t(()=>[i(`span`,lt,[n[19]||=i(`i`,{class:`pi pi-image`},null,-1),n[20]||=A(` الصور `,-1),i(`span`,ut,S(_.value.length),1)])]),_:1}),D(s(Q),{value:`documents`},{default:t(()=>[i(`span`,dt,[n[21]||=i(`i`,{class:`pi pi-folder-open`},null,-1),n[22]||=A(` المستندات `,-1),i(`span`,ft,S(v.value.length),1)])]),_:1})]),_:1}),D(s(xe),null,{default:t(()=>[D(s($),{value:`images`},{default:t(()=>[i(`div`,pt,[n[23]||=i(`div`,null,[i(`h3`,null,`صور الوحدة`),i(`p`,null,`ارفع صوراً للوحدة ورتّبها حسب الظهور`)],-1),i(`input`,{ref_key:`imageInputRef`,ref:H,type:`file`,accept:`image/*`,hidden:``,onChange:me},null,544),D(s(B),{label:`رفع صورة`,icon:`pi pi-upload`,loading:x.value,onClick:pe},null,8,[`loading`])]),_.value.length?(T(),m(`div`,mt,[(T(!0),m(l,null,b(_.value,e=>(T(),m(`article`,{key:e.id,class:`media-card`},[i(`div`,ht,[i(`img`,{src:K(e.imagePath),alt:`صورة ${e.sortOrder}`},null,8,gt),i(`span`,_t,`ترتيب `+S(e.sortOrder),1)]),i(`div`,vt,[i(`div`,yt,S(s(ee)(e.createdAt)),1),i(`div`,bt,[o((T(),m(`button`,{type:`button`,class:`action-btn is-edit`,"aria-label":`تعديل الترتيب`,onClick:t=>he(e)},[...n[24]||=[i(`i`,{class:`pi pi-pencil`},null,-1)]],8,xt)),[[r,`تعديل الترتيب`,void 0,{top:!0}]]),o((T(),m(`button`,{type:`button`,class:`action-btn is-delete`,"aria-label":`حذف`,onClick:t=>_e(e)},[...n[25]||=[i(`i`,{class:`pi pi-trash`},null,-1)]],8,St)),[[r,`حذف`,void 0,{top:!0}]])])])]))),128))])):(T(),m(`div`,Ct,`لا توجد صور لهذه الوحدة بعد`))]),_:1}),D(s($),{value:`documents`},{default:t(()=>[n[30]||=i(`div`,{class:`media-toolbar`},[i(`div`,null,[i(`h3`,null,`مستندات الوحدة`),i(`p`,null,`عقود، مخططات، ومستندات مرتبطة بالوحدة`)])],-1),i(`div`,wt,[D(s(U),{modelValue:O.value,"onUpdate:modelValue":n[1]||=e=>O.value=e,placeholder:`عنوان المستند`,class:`doc-title-input`},null,8,[`modelValue`]),i(`input`,{ref_key:`docInputRef`,ref:W,type:`file`,hidden:``,onChange:ye},null,544),D(s(B),{label:k.value?`تغيير الملف`:`اختيار ملف`,icon:`pi pi-file`,severity:`secondary`,outlined:``,onClick:ve},null,8,[`label`]),k.value?(T(),m(`span`,Tt,S(k.value.name),1)):u(``,!0),D(s(B),{label:`رفع مستند`,icon:`pi pi-upload`,loading:C.value,onClick:be},null,8,[`loading`])]),D(s(ce),{value:v.value,"striped-rows":``,size:`small`},{empty:t(()=>[...n[29]||=[i(`div`,{class:`empty-box`},`لا توجد مستندات لهذه الوحدة بعد`,-1)]]),default:t(()=>[D(s(G),{field:`title`,header:`العنوان`}),D(s(G),{header:`تاريخ الرفع`,style:{width:`140px`}},{body:t(({data:e})=>[A(S(s(ee)(e.createdAt)),1)]),_:1}),D(s(G),{header:`الملف`},{body:t(({data:e})=>[e.documentPath?(T(),m(`a`,{key:0,class:`file-link`,href:K(e.documentPath),target:`_blank`,rel:`noopener`},[...n[26]||=[i(`i`,{class:`pi pi-external-link`},null,-1),A(` فتح الملف `,-1)]],8,Et)):(T(),m(`span`,Dt,`—`))]),_:1}),D(s(G),{header:`إجراءات`,style:{width:`130px`}},{body:t(({data:e})=>[i(`div`,Ot,[o((T(),m(`button`,{type:`button`,class:`action-btn is-edit`,"aria-label":`تعديل العنوان`,onClick:t=>Se(e)},[...n[27]||=[i(`i`,{class:`pi pi-pencil`},null,-1)]],8,kt)),[[r,`تعديل العنوان`,void 0,{top:!0}]]),o((T(),m(`button`,{type:`button`,class:`action-btn is-delete`,"aria-label":`حذف`,onClick:t=>we(e)},[...n[28]||=[i(`i`,{class:`pi pi-trash`},null,-1)]],8,At)),[[r,`حذف`,void 0,{top:!0}]])])]),_:1})]),_:1},8,[`value`])]),_:1})]),_:1})]),_:1},8,[`value`])])),D(s(V),{visible:j.value,"onUpdate:visible":n[5]||=e=>j.value=e,modal:``,header:`تعديل ترتيب الصورة`,style:{width:`420px`}},{footer:t(()=>[i(`div`,Mt,[D(s(B),{label:`إلغاء`,severity:`secondary`,outlined:``,onClick:n[4]||=e=>j.value=!1}),D(s(B),{label:`حفظ التغييرات`,loading:P.value,onClick:ge},null,8,[`loading`])])]),default:t(()=>[i(`div`,jt,[n[31]||=i(`label`,null,`ترتيب الظهور`,-1),D(s(se),{modelValue:R.value,"onUpdate:modelValue":n[3]||=e=>R.value=e,min:0},null,8,[`modelValue`])])]),_:1},8,[`visible`]),D(s(V),{visible:N.value,"onUpdate:visible":n[8]||=e=>N.value=e,modal:``,header:`تعديل عنوان المستند`,style:{width:`420px`}},{footer:t(()=>[i(`div`,Pt,[D(s(B),{label:`إلغاء`,severity:`secondary`,outlined:``,onClick:n[7]||=e=>N.value=!1}),D(s(B),{label:`حفظ التغييرات`,loading:P.value,onClick:Ce},null,8,[`loading`])])]),default:t(()=>[i(`div`,Nt,[n[32]||=i(`label`,null,`العنوان`,-1),D(s(U),{modelValue:z.value,"onUpdate:modelValue":n[6]||=e=>z.value=e,placeholder:`عنوان المستند`},null,8,[`modelValue`])])]),_:1},8,[`visible`])])}}}),[[`__scopeId`,`data-v-b7cb8e7d`]]);export{Ft as default};
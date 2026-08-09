import{$n as e,At as t,Bn as n,Dt as r,En as i,F as a,Jn as o,Mn as s,N as c,On as l,Sn as u,U as d,Z as f,_t as p,a as m,an as ee,b as te,cn as h,gr as g,hn as _,it as v,jn as y,kn as b,kt as x,l as ne,ln as S,lt as C,m as re,mn as w,n as T,nn as E,nt as D,on as O,pn as k,pr as A,qt as j,sn as M,st as N,t as P,u as F,wn as ie,x as ae,zn as I}from"./client-DKXER64_.js";import{f as L,i as R,t as z}from"./button-BeSqpoBv.js";import{c as oe,n as se,s as ce}from"./index-D1UI9Meh.js";import{t as B}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{n as le}from"./overlayeventbus-B4TkcSJO.js";import{r as ue,t as V}from"./chevronright-fuC1kt22.js";import{n as de,t as H}from"./column-C1ztJ2Av.js";import{n as fe,t as pe}from"./useNotify-DJIPD37T.js";import{n as me,t as U}from"./skeleton-CIyU-ANr.js";import{t as W}from"./chevronleft-p9TKym6S.js";import{r as he}from"./units-CuxtugE2.js";var G=a.extend({name:`tabs`,style:`
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
`,classes:{root:function(e){return[`p-tabs p-component`,{"p-tabs-scrollable":e.props.scrollable}]}}}),K={name:`Tabs`,extends:{name:`BaseTabs`,extends:c,props:{value:{type:[String,Number],default:void 0},lazy:{type:Boolean,default:!1},scrollable:{type:Boolean,default:!1},showNavigators:{type:Boolean,default:!0},tabindex:{type:Number,default:0},selectOnFocus:{type:Boolean,default:!1}},style:G,provide:function(){return{$pcTabs:this,$parentInstance:this}}},inheritAttrs:!1,emits:[`update:value`],data:function(){return{d_value:this.value}},watch:{value:function(e){this.d_value=e}},methods:{updateValue:function(e){this.d_value!==e&&(this.d_value=e,this.$emit(`update:value`,e))},isVertical:function(){return this.orientation===`vertical`}}};function q(e,t,n,r,a,o){return i(),S(`div`,u({class:e.cx(`root`)},e.ptmi(`root`)),[b(e.$slots,`default`)],16)}K.render=q;var J={name:`TabList`,extends:{name:`BaseTabList`,extends:c,props:{},style:a.extend({name:`tablist`,classes:{root:`p-tablist`,content:`p-tablist-content p-tablist-viewport`,tabList:`p-tablist-tab-list`,activeBar:`p-tablist-active-bar`,prevButton:`p-tablist-prev-button p-tablist-nav-button`,nextButton:`p-tablist-next-button p-tablist-nav-button`}}),provide:function(){return{$pcTabList:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`],data:function(){return{isPrevButtonEnabled:!1,isNextButtonEnabled:!0}},resizeObserver:void 0,watch:{showNavigators:function(e){e?this.bindResizeObserver():this.unbindResizeObserver()},activeValue:{flush:`post`,handler:function(){this.updateInkBar()}}},mounted:function(){var e=this;setTimeout(function(){e.updateInkBar()},150),this.showNavigators&&(this.updateButtonState(),this.bindResizeObserver())},updated:function(){this.showNavigators&&this.updateButtonState()},beforeUnmount:function(){this.unbindResizeObserver()},methods:{onScroll:function(e){this.showNavigators&&this.updateButtonState(),e.preventDefault()},onPrevButtonClick:function(){var e=this.$refs.content,t=this.getVisibleButtonWidths(),n=v(e)-t,r=Math.abs(e.scrollLeft)-n*.8,i=Math.max(r,0);e.scrollLeft=C(e)?-1*i:i},onNextButtonClick:function(){var e=this.$refs.content,t=this.getVisibleButtonWidths(),n=v(e)-t,r=Math.abs(e.scrollLeft)+n*.8,i=e.scrollWidth-n,a=Math.min(r,i);e.scrollLeft=C(e)?-1*a:a},bindResizeObserver:function(){var e=this;this.resizeObserver=new ResizeObserver(function(){return e.updateButtonState()}),this.resizeObserver.observe(this.$refs.list)},unbindResizeObserver:function(){var e;(e=this.resizeObserver)==null||e.unobserve(this.$refs.list),this.resizeObserver=void 0},updateInkBar:function(){var e=this.$refs,t=e.content,n=e.inkbar,i=e.tabs;if(n){var a=x(t,`[data-pc-name="tab"][data-p-active="true"]`);this.$pcTabs.isVertical()?(n.style.height=d(a)+`px`,n.style.top=f(a).top-f(i).top+`px`):(n.style.width=r(a)+`px`,n.style.left=f(a).left-f(i).left+`px`)}},updateButtonState:function(){var e=this.$refs,t=e.list,n=e.content,r=n.scrollTop,i=n.scrollWidth,a=n.scrollHeight,o=n.offsetWidth,s=n.offsetHeight,c=Math.abs(n.scrollLeft),l=[v(n),N(n)],u=l[0],d=l[1];this.$pcTabs.isVertical()?(this.isPrevButtonEnabled=r!==0,this.isNextButtonEnabled=t.offsetHeight>=s&&parseInt(r)!==a-d):(this.isPrevButtonEnabled=c!==0,this.isNextButtonEnabled=t.offsetWidth>=o&&parseInt(c)!==i-u)},getVisibleButtonWidths:function(){var e=this.$refs,t=e.prevButton,n=e.nextButton,r=0;return this.showNavigators&&(r=(t?.offsetWidth||0)+(n?.offsetWidth||0)),r}},computed:{templates:function(){return this.$pcTabs.$slots},activeValue:function(){return this.$pcTabs.d_value},showNavigators:function(){return this.$pcTabs.showNavigators},prevButtonAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.previous:void 0},nextButtonAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.next:void 0},dataP:function(){return t({scrollable:this.$pcTabs.scrollable})}},components:{ChevronLeftIcon:W,ChevronRightIcon:V},directives:{ripple:R}},Y=[`data-p`],X=[`aria-label`,`tabindex`],ge=[`data-p`],_e=[`aria-orientation`],ve=[`aria-label`,`tabindex`];function Z(e,t,r,a,o,c){var l=y(`ripple`);return i(),S(`div`,u({ref:`list`,class:e.cx(`root`),"data-p":c.dataP},e.ptmi(`root`)),[c.showNavigators&&o.isPrevButtonEnabled?n((i(),S(`button`,u({key:0,ref:`prevButton`,type:`button`,class:e.cx(`prevButton`),"aria-label":c.prevButtonAriaLabel,tabindex:c.$pcTabs.tabindex,onClick:t[0]||=function(){return c.onPrevButtonClick&&c.onPrevButtonClick.apply(c,arguments)}},e.ptm(`prevButton`),{"data-pc-group-section":`navigator`}),[(i(),M(s(c.templates.previcon||`ChevronLeftIcon`),u({"aria-hidden":`true`},e.ptm(`prevIcon`)),null,16))],16,X)),[[l]]):h(``,!0),O(`div`,u({ref:`content`,class:e.cx(`content`),onScroll:t[1]||=function(){return c.onScroll&&c.onScroll.apply(c,arguments)},"data-p":c.dataP},e.ptm(`content`)),[O(`div`,u({ref:`tabs`,class:e.cx(`tabList`),role:`tablist`,"aria-orientation":c.$pcTabs.orientation||`horizontal`},e.ptm(`tabList`)),[b(e.$slots,`default`),O(`span`,u({ref:`inkbar`,class:e.cx(`activeBar`),role:`presentation`,"aria-hidden":`true`},e.ptm(`activeBar`)),null,16)],16,_e)],16,ge),c.showNavigators&&o.isNextButtonEnabled?n((i(),S(`button`,u({key:1,ref:`nextButton`,type:`button`,class:e.cx(`nextButton`),"aria-label":c.nextButtonAriaLabel,tabindex:c.$pcTabs.tabindex,onClick:t[2]||=function(){return c.onNextButtonClick&&c.onNextButtonClick.apply(c,arguments)}},e.ptm(`nextButton`),{"data-pc-group-section":`navigator`}),[(i(),M(s(c.templates.nexticon||`ChevronRightIcon`),u({"aria-hidden":`true`},e.ptm(`nextIcon`)),null,16))],16,ve)),[[l]]):h(``,!0)],16,Y)}J.render=Z;var ye=a.extend({name:`tab`,classes:{root:function(e){var t=e.instance,n=e.props;return[`p-tab`,{"p-tab-active":t.active,"p-disabled":n.disabled}]}}}),Q={name:`Tab`,extends:{name:`BaseTab`,extends:c,props:{value:{type:[String,Number],default:void 0},disabled:{type:Boolean,default:!1},as:{type:[String,Object],default:`BUTTON`},asChild:{type:Boolean,default:!1}},style:ye,provide:function(){return{$pcTab:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`,`$pcTabList`],methods:{onFocus:function(){this.$pcTabs.selectOnFocus&&this.changeActiveValue()},onClick:function(){this.changeActiveValue()},onKeydown:function(e){switch(e.code){case`ArrowRight`:this.onArrowRightKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:case`Space`:this.onEnterKey(e);break}},onArrowRightKey:function(e){var t=this.findNextTab(e.currentTarget);t?this.changeFocusedTab(e,t):this.onHomeKey(e),e.preventDefault()},onArrowLeftKey:function(e){var t=this.findPrevTab(e.currentTarget);t?this.changeFocusedTab(e,t):this.onEndKey(e),e.preventDefault()},onHomeKey:function(e){var t=this.findFirstTab();this.changeFocusedTab(e,t),e.preventDefault()},onEndKey:function(e){var t=this.findLastTab();this.changeFocusedTab(e,t),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.findLastTab()),e.preventDefault()},onPageUpKey:function(e){this.scrollInView(this.findFirstTab()),e.preventDefault()},onEnterKey:function(e){this.changeActiveValue()},findNextTab:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1]?e:e.nextElementSibling;return t?D(t,`data-p-disabled`)||D(t,`data-pc-section`)===`activebar`?this.findNextTab(t):x(t,`[data-pc-name="tab"]`):null},findPrevTab:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1]?e:e.previousElementSibling;return t?D(t,`data-p-disabled`)||D(t,`data-pc-section`)===`activebar`?this.findPrevTab(t):x(t,`[data-pc-name="tab"]`):null},findFirstTab:function(){return this.findNextTab(this.$pcTabList.$refs.tabs.firstElementChild,!0)},findLastTab:function(){return this.findPrevTab(this.$pcTabList.$refs.tabs.lastElementChild,!0)},changeActiveValue:function(){this.$pcTabs.updateValue(this.value)},changeFocusedTab:function(e,t){p(t),this.scrollInView(t)},scrollInView:function(e){var t;e==null||(t=e.scrollIntoView)==null||t.call(e,{block:`nearest`})}},computed:{active:function(){return j(this.$pcTabs?.d_value,this.value)},id:function(){return`${this.$pcTabs?.$id}_tab_${this.value}`},ariaControls:function(){return`${this.$pcTabs?.$id}_tabpanel_${this.value}`},attrs:function(){return u(this.asAttrs,this.a11yAttrs,this.ptmi(`root`,this.ptParams))},asAttrs:function(){return this.as===`BUTTON`?{type:`button`,disabled:this.disabled}:void 0},a11yAttrs:function(){return{id:this.id,tabindex:this.active?this.$pcTabs.tabindex:-1,role:`tab`,"aria-selected":this.active,"aria-controls":this.ariaControls,"data-pc-name":`tab`,"data-p-disabled":this.disabled,"data-p-active":this.active,onFocus:this.onFocus,onKeydown:this.onKeydown}},ptParams:function(){return{context:{active:this.active}}},dataP:function(){return t({active:this.active})}},directives:{ripple:R}};function be(e,t,r,a,o,c){var l=y(`ripple`);return e.asChild?b(e.$slots,`default`,{key:1,dataP:c.dataP,class:A(e.cx(`root`)),active:c.active,a11yAttrs:c.a11yAttrs,onClick:c.onClick}):n((i(),M(s(e.as),u({key:0,class:e.cx(`root`),"data-p":c.dataP,onClick:c.onClick},c.attrs),{default:I(function(){return[b(e.$slots,`default`)]}),_:3},16,[`class`,`data-p`,`onClick`])),[[l]])}Q.render=be;var xe={name:`TabPanels`,extends:{name:`BaseTabPanels`,extends:c,props:{},style:a.extend({name:`tabpanels`,classes:{root:`p-tabpanels`}}),provide:function(){return{$pcTabPanels:this,$parentInstance:this}}},inheritAttrs:!1};function Se(e,t,n,r,a,o){return i(),S(`div`,u({class:e.cx(`root`),role:`presentation`},e.ptmi(`root`)),[b(e.$slots,`default`)],16)}xe.render=Se;var Ce=a.extend({name:`tabpanel`,classes:{root:function(e){return[`p-tabpanel`,{"p-tabpanel-active":e.instance.active}]}}}),$={name:`TabPanel`,extends:{name:`BaseTabPanel`,extends:c,props:{value:{type:[String,Number],default:void 0},as:{type:[String,Object],default:`DIV`},asChild:{type:Boolean,default:!1},header:null,headerStyle:null,headerClass:null,headerProps:null,headerActionProps:null,contentStyle:null,contentClass:null,contentProps:null,disabled:Boolean},style:Ce,provide:function(){return{$pcTabPanel:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`],computed:{active:function(){return j(this.$pcTabs?.d_value,this.value)},id:function(){return`${this.$pcTabs?.$id}_tabpanel_${this.value}`},ariaLabelledby:function(){return`${this.$pcTabs?.$id}_tab_${this.value}`},attrs:function(){return u(this.a11yAttrs,this.ptmi(`root`,this.ptParams))},a11yAttrs:function(){return{id:this.id,tabindex:this.$pcTabs?.tabindex,role:`tabpanel`,"aria-labelledby":this.ariaLabelledby,"data-pc-name":`tabpanel`,"data-p-active":this.active}},ptParams:function(){return{context:{active:this.active}}}}};function we(e,t,r,a,o,c){var l,d;return c.$pcTabs?(i(),S(E,{key:1},[e.asChild?b(e.$slots,`default`,{key:1,class:A(e.cx(`root`)),active:c.active,a11yAttrs:c.a11yAttrs}):(i(),S(E,{key:0},[!((l=c.$pcTabs)!=null&&l.lazy)||c.active?n((i(),M(s(e.as),u({key:0,class:e.cx(`root`)},c.attrs),{default:I(function(){return[b(e.$slots,`default`)]}),_:3},16,[`class`])),[[L,(d=c.$pcTabs)!=null&&d.lazy?!0:c.active]]):h(``,!0)],64))],64)):b(e.$slots,`default`,{key:0})}$.render=we;async function Te(e,t){return m(await P.get(`/api/units/${e}/images`,{params:t}))}async function Ee(e,t,n=0){let r=new FormData;return r.append(`file`,t),r.append(`SortOrder`,String(n)),m(await P.post(`/api/units/${e}/images`,r,{headers:{"Content-Type":`multipart/form-data`}}))}async function De(e,t,n){return m(await P.put(`/api/units/${e}/images/${t}`,{sortOrder:n}))}async function Oe(e,t){return m(await P.delete(`/api/units/${e}/images/${t}`))}async function ke(e,t){return m(await P.get(`/api/units/${e}/documents`,{params:t}))}async function Ae(e,t,n){let r=new FormData;return r.append(`file`,t),r.append(`Title`,n),m(await P.post(`/api/units/${e}/documents`,r,{headers:{"Content-Type":`multipart/form-data`}}))}async function je(e,t,n){return m(await P.put(`/api/units/${e}/documents/${t}`,{title:n}))}async function Me(e,t){return m(await P.delete(`/api/units/${e}/documents/${t}`))}var Ne={class:`detail-skeleton`,"aria-busy":`true`,"aria-label":`جاري التحميل`},Pe={class:`detail-skeleton__header`},Fe={class:`detail-skeleton__grid`},Ie={class:`detail-skeleton__tabs`},Le={class:`detail-skeleton__media`},Re=B(_({__name:`DetailSkeleton`,setup(t){return(t,n)=>(i(),S(`div`,Ne,[O(`div`,Pe,[w(e(U),{width:`10rem`,height:`1.5rem`,"border-radius":`8px`}),w(e(U),{width:`16rem`,height:`0.85rem`,"border-radius":`8px`,class:`mt-sm`})]),O(`div`,Fe,[(i(),S(E,null,l(8,t=>O(`div`,{key:t,class:`detail-skeleton__cell`},[w(e(U),{width:`4.5rem`,height:`0.7rem`,"border-radius":`6px`}),w(e(U),{width:`70%`,height:`1rem`,"border-radius":`8px`,class:`mt-sm`})])),64))]),O(`div`,Ie,[w(e(U),{width:`6rem`,height:`2.2rem`,"border-radius":`10px`}),w(e(U),{width:`6rem`,height:`2.2rem`,"border-radius":`10px`})]),O(`div`,Le,[(i(),S(E,null,l(4,t=>w(e(U),{key:t,height:`8.5rem`,"border-radius":`14px`})),64))])]))}}),[[`__scopeId`,`data-v-0ac05a1e`]]),ze={class:`page`},Be={key:1,class:`data-panel`},Ve={class:`detail-grid`},He={class:`detail-item`},Ue={class:`detail-value`},We={class:`detail-item`},Ge={class:`detail-value`},Ke={class:`detail-item`},qe={class:`detail-value`},Je={class:`detail-item`},Ye={class:`detail-value`},Xe={class:`detail-item`},Ze={class:`detail-value`},Qe={class:`detail-item`},$e={class:`detail-value`},et={class:`detail-item`},tt={class:`detail-value`},nt={class:`detail-item`},rt={class:`detail-value`},it={class:`detail-item`},at={class:`detail-value`},ot={class:`detail-item full`},st={class:`detail-value`},ct={key:2,class:`data-panel media-panel`},lt={class:`tab-label`},ut={class:`tab-count`},dt={class:`tab-label`},ft={class:`tab-count`},pt={class:`media-toolbar`},mt={key:0,class:`media-grid`},ht={class:`media-thumb`},gt=[`src`,`alt`],_t={class:`sort-badge`},vt={class:`media-body`},yt={class:`media-date`},bt={class:`row-actions`},xt=[`onClick`],St=[`onClick`],Ct={key:1,class:`empty-box`},wt={class:`doc-upload-bar`},Tt={key:0,class:`file-name`},Et=[`href`],Dt={key:1},Ot={class:`row-actions`},kt=[`onClick`],At=[`onClick`],jt={class:`field`},Mt={class:`dialog-actions`},Nt={class:`field`},Pt={class:`dialog-actions`},Ft=B(_({__name:`UnitDetailView`,setup(t){let r=ce(),a=oe(),s=fe(),{ask:c}=pe(),u=ee(()=>String(r.params.id)),d=o(!0),f=o(null),p=o([]),m=o([]),_=o(`images`),v=o(!1),b=o(!1),x=o(``),C=o(null),D=o(!1),A=o(!1),j=o(!1),N=o(null),P=o(null),L=o(0),R=o(``),B=o(null),V=o(null);function U(e){return e?e.startsWith(`http`)?e:`${`https://pmsaas-api.execute-iq.com`.replace(/\/$/,``)}/${e.replace(/^\//,``)}`:``}async function W(){let e=await Te(u.value,{Page:1,PageSize:100});p.value=e.items??[]}async function G(){let e=await ke(u.value,{Page:1,PageSize:100});m.value=e.items??[]}async function q(){d.value=!0;try{let[e]=await Promise.all([he(u.value),W(),G()]);f.value=e}catch(e){s.error(T(e))}finally{d.value=!1}}function Y(){B.value?.click()}async function X(e){let t=e.target,n=t.files?.[0];if(t.value=``,n){v.value=!0;try{let e=p.value.length;await Ee(u.value,n,e),s.success(`تم رفع الصورة بنجاح`),await W()}catch(e){s.error(T(e))}finally{v.value=!1}}}function ge(e){N.value=e,L.value=e.sortOrder,D.value=!0}async function _e(){if(N.value){j.value=!0;try{await De(u.value,N.value.id,L.value),s.success(`تم تحديث ترتيب الصورة`),D.value=!1,await W()}catch(e){s.error(T(e))}finally{j.value=!1}}}async function ve(e){if(await c(`حذف هذه الصورة نهائياً؟`,`تأكيد الحذف`))try{await Oe(u.value,e.id),s.success(`تم حذف الصورة`),p.value=p.value.filter(t=>t.id!==e.id)}catch(e){s.error(T(e))}}function Z(){V.value?.click()}function ye(e){let t=e.target,n=t.files?.[0];t.value=``,n&&(C.value=n,x.value.trim()||(x.value=n.name.replace(/\.[^.]+$/,``)))}async function be(){if(!C.value){s.warning(`اختر ملفاً أولاً`);return}if(!x.value.trim()){s.warning(`أدخل عنوان المستند`);return}b.value=!0;try{await Ae(u.value,C.value,x.value.trim()),s.success(`تم رفع المستند بنجاح`),x.value=``,C.value=null,await G()}catch(e){s.error(T(e))}finally{b.value=!1}}function Se(e){P.value=e,R.value=e.title||``,A.value=!0}async function Ce(){if(P.value){if(!R.value.trim()){s.warning(`أدخل عنوان المستند`);return}j.value=!0;try{await je(u.value,P.value.id,R.value.trim()),s.success(`تم تحديث عنوان المستند`),A.value=!1,await G()}catch(e){s.error(T(e))}finally{j.value=!1}}}async function we(e){if(await c(`حذف المستند "${e.title||`بدون عنوان`}"؟`,`تأكيد الحذف`))try{await Me(u.value,e.id),s.success(`تم حذف المستند`),m.value=m.value.filter(t=>t.id!==e.id)}catch(e){s.error(T(e))}}return ie(()=>void q()),(t,r)=>{let o=y(`tooltip`);return i(),S(`div`,ze,[w(me,{title:`تفاصيل الوحدة ${f.value?.unitNumber||``}`,subtitle:`بيانات الوحدة مع إدارة الصور والمستندات`},{actions:I(()=>[w(e(z),{label:`العودة إلى الوحدات`,icon:`pi pi-arrow-right`,severity:`secondary`,outlined:``,onClick:r[0]||=t=>e(a).push(`/units`)})]),_:1},8,[`title`]),d.value?(i(),M(Re,{key:0})):f.value?(i(),S(`div`,Be,[O(`div`,Ve,[O(`div`,He,[r[9]||=O(`span`,{class:`detail-label`},`رقم الوحدة`,-1),O(`span`,Ue,g(f.value.unitNumber),1)]),O(`div`,We,[r[10]||=O(`span`,{class:`detail-label`},`النوع`,-1),O(`span`,Ge,g(e(re)(e(ae),f.value.unitType)),1)]),O(`div`,Ke,[r[11]||=O(`span`,{class:`detail-label`},`الحالة`,-1),O(`span`,qe,g(e(re)(e(te),f.value.status)),1)]),O(`div`,Je,[r[12]||=O(`span`,{class:`detail-label`},`المساحة`,-1),O(`span`,Ye,g(f.value.area),1)]),O(`div`,Xe,[r[13]||=O(`span`,{class:`detail-label`},`غرف النوم`,-1),O(`span`,Ze,g(f.value.bedrooms),1)]),O(`div`,Qe,[r[14]||=O(`span`,{class:`detail-label`},`الحمامات`,-1),O(`span`,$e,g(f.value.bathrooms),1)]),O(`div`,et,[r[15]||=O(`span`,{class:`detail-label`},`السعر`,-1),O(`span`,tt,g(e(F)(f.value.price)),1)]),O(`div`,nt,[r[16]||=O(`span`,{class:`detail-label`},`التكلفة`,-1),O(`span`,rt,g(e(F)(f.value.cost)),1)]),O(`div`,it,[r[17]||=O(`span`,{class:`detail-label`},`الاتجاه`,-1),O(`span`,at,g(f.value.direction||`—`),1)]),O(`div`,ot,[r[18]||=O(`span`,{class:`detail-label`},`ملاحظات`,-1),O(`span`,st,g(f.value.notes||`—`),1)])])])):h(``,!0),d.value?h(``,!0):(i(),S(`div`,ct,[w(e(K),{value:_.value,"onUpdate:value":r[2]||=e=>_.value=e},{default:I(()=>[w(e(J),null,{default:I(()=>[w(e(Q),{value:`images`},{default:I(()=>[O(`span`,lt,[r[19]||=O(`i`,{class:`pi pi-image`},null,-1),r[20]||=k(` الصور `,-1),O(`span`,ut,g(p.value.length),1)])]),_:1}),w(e(Q),{value:`documents`},{default:I(()=>[O(`span`,dt,[r[21]||=O(`i`,{class:`pi pi-folder-open`},null,-1),r[22]||=k(` المستندات `,-1),O(`span`,ft,g(m.value.length),1)])]),_:1})]),_:1}),w(e(xe),null,{default:I(()=>[w(e($),{value:`images`},{default:I(()=>[O(`div`,pt,[r[23]||=O(`div`,null,[O(`h3`,null,`صور الوحدة`),O(`p`,null,`ارفع صوراً للوحدة ورتّبها حسب الظهور`)],-1),O(`input`,{ref_key:`imageInputRef`,ref:B,type:`file`,accept:`image/*`,hidden:``,onChange:X},null,544),w(e(z),{label:`رفع صورة`,icon:`pi pi-upload`,loading:v.value,onClick:Y},null,8,[`loading`])]),p.value.length?(i(),S(`div`,mt,[(i(!0),S(E,null,l(p.value,t=>(i(),S(`article`,{key:t.id,class:`media-card`},[O(`div`,ht,[O(`img`,{src:U(t.imagePath),alt:`صورة ${t.sortOrder}`},null,8,gt),O(`span`,_t,`ترتيب `+g(t.sortOrder),1)]),O(`div`,vt,[O(`div`,yt,g(e(ne)(t.createdAt)),1),O(`div`,bt,[n((i(),S(`button`,{type:`button`,class:`action-btn is-edit`,"aria-label":`تعديل الترتيب`,onClick:e=>ge(t)},[...r[24]||=[O(`i`,{class:`pi pi-pencil`},null,-1)]],8,xt)),[[o,`تعديل الترتيب`,void 0,{top:!0}]]),n((i(),S(`button`,{type:`button`,class:`action-btn is-delete`,"aria-label":`حذف`,onClick:e=>ve(t)},[...r[25]||=[O(`i`,{class:`pi pi-trash`},null,-1)]],8,St)),[[o,`حذف`,void 0,{top:!0}]])])])]))),128))])):(i(),S(`div`,Ct,`لا توجد صور لهذه الوحدة بعد`))]),_:1}),w(e($),{value:`documents`},{default:I(()=>[r[30]||=O(`div`,{class:`media-toolbar`},[O(`div`,null,[O(`h3`,null,`مستندات الوحدة`),O(`p`,null,`عقود، مخططات، ومستندات مرتبطة بالوحدة`)])],-1),O(`div`,wt,[w(e(le),{modelValue:x.value,"onUpdate:modelValue":r[1]||=e=>x.value=e,placeholder:`عنوان المستند`,class:`doc-title-input`},null,8,[`modelValue`]),O(`input`,{ref_key:`docInputRef`,ref:V,type:`file`,hidden:``,onChange:ye},null,544),w(e(z),{label:C.value?`تغيير الملف`:`اختيار ملف`,icon:`pi pi-file`,severity:`secondary`,outlined:``,onClick:Z},null,8,[`label`]),C.value?(i(),S(`span`,Tt,g(C.value.name),1)):h(``,!0),w(e(z),{label:`رفع مستند`,icon:`pi pi-upload`,loading:b.value,onClick:be},null,8,[`loading`])]),w(e(de),{value:m.value,"striped-rows":``,size:`small`},{empty:I(()=>[...r[29]||=[O(`div`,{class:`empty-box`},`لا توجد مستندات لهذه الوحدة بعد`,-1)]]),default:I(()=>[w(e(H),{field:`title`,header:`العنوان`}),w(e(H),{header:`تاريخ الرفع`,style:{width:`140px`}},{body:I(({data:t})=>[k(g(e(ne)(t.createdAt)),1)]),_:1}),w(e(H),{header:`الملف`},{body:I(({data:e})=>[e.documentPath?(i(),S(`a`,{key:0,class:`file-link`,href:U(e.documentPath),target:`_blank`,rel:`noopener`},[...r[26]||=[O(`i`,{class:`pi pi-external-link`},null,-1),k(` فتح الملف `,-1)]],8,Et)):(i(),S(`span`,Dt,`—`))]),_:1}),w(e(H),{header:`إجراءات`,style:{width:`130px`}},{body:I(({data:e})=>[O(`div`,Ot,[n((i(),S(`button`,{type:`button`,class:`action-btn is-edit`,"aria-label":`تعديل العنوان`,onClick:t=>Se(e)},[...r[27]||=[O(`i`,{class:`pi pi-pencil`},null,-1)]],8,kt)),[[o,`تعديل العنوان`,void 0,{top:!0}]]),n((i(),S(`button`,{type:`button`,class:`action-btn is-delete`,"aria-label":`حذف`,onClick:t=>we(e)},[...r[28]||=[O(`i`,{class:`pi pi-trash`},null,-1)]],8,At)),[[o,`حذف`,void 0,{top:!0}]])])]),_:1})]),_:1},8,[`value`])]),_:1})]),_:1})]),_:1},8,[`value`])])),w(e(se),{visible:D.value,"onUpdate:visible":r[5]||=e=>D.value=e,modal:``,header:`تعديل ترتيب الصورة`,style:{width:`420px`}},{footer:I(()=>[O(`div`,Mt,[w(e(z),{label:`إلغاء`,severity:`secondary`,outlined:``,onClick:r[4]||=e=>D.value=!1}),w(e(z),{label:`حفظ التغييرات`,loading:j.value,onClick:_e},null,8,[`loading`])])]),default:I(()=>[O(`div`,jt,[r[31]||=O(`label`,null,`ترتيب الظهور`,-1),w(e(ue),{modelValue:L.value,"onUpdate:modelValue":r[3]||=e=>L.value=e,min:0},null,8,[`modelValue`])])]),_:1},8,[`visible`]),w(e(se),{visible:A.value,"onUpdate:visible":r[8]||=e=>A.value=e,modal:``,header:`تعديل عنوان المستند`,style:{width:`420px`}},{footer:I(()=>[O(`div`,Pt,[w(e(z),{label:`إلغاء`,severity:`secondary`,outlined:``,onClick:r[7]||=e=>A.value=!1}),w(e(z),{label:`حفظ التغييرات`,loading:j.value,onClick:Ce},null,8,[`loading`])])]),default:I(()=>[O(`div`,Nt,[r[32]||=O(`label`,null,`العنوان`,-1),w(e(le),{modelValue:R.value,"onUpdate:modelValue":r[6]||=e=>R.value=e,placeholder:`عنوان المستند`},null,8,[`modelValue`])])]),_:1},8,[`visible`])])}}}),[[`__scopeId`,`data-v-b7cb8e7d`]]);export{Ft as default};
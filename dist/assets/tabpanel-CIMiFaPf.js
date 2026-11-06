import{A as e,F as t,I as n,J as r,N as i,Y as a,c as o,kt as s,l as c,r as l,s as u,u as d,w as f}from"./runtime-core.esm-bundler-Dhk7EoYY.js";import{E as p,Q as m,Y as h,Z as g,d as _,ht as v,j as y,k as b,r as x,t as S,w as C,y as w,z as T}from"./basecomponent-COb0tzgW.js";import{i as E}from"./button-Ik5BKO1o.js";import{Rt as D}from"./index-C5zNCBEs.js";import{t as O}from"./chevronleft-BRVqg75N.js";import{t as k}from"./chevronright-5dIMeGXB.js";var A=x.extend({name:`tabs`,style:`
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
`,classes:{root:function(e){return[`p-tabs p-component`,{"p-tabs-scrollable":e.props.scrollable}]}}}),j={name:`Tabs`,extends:{name:`BaseTabs`,extends:S,props:{value:{type:[String,Number],default:void 0},lazy:{type:Boolean,default:!1},scrollable:{type:Boolean,default:!1},showNavigators:{type:Boolean,default:!0},tabindex:{type:Number,default:0},selectOnFocus:{type:Boolean,default:!1}},style:A,provide:function(){return{$pcTabs:this,$parentInstance:this}}},inheritAttrs:!1,emits:[`update:value`],data:function(){return{d_value:this.value}},watch:{value:function(e){this.d_value=e}},methods:{updateValue:function(e){this.d_value!==e&&(this.d_value=e,this.$emit(`update:value`,e))},isVertical:function(){return this.orientation===`vertical`}}};function M(t,n,r,a,o,s){return e(),d(`div`,f({class:t.cx(`root`)},t.ptmi(`root`)),[i(t.$slots,`default`)],16)}j.render=M;var N={name:`TabList`,extends:{name:`BaseTabList`,extends:S,props:{},style:x.extend({name:`tablist`,classes:{root:`p-tablist`,content:`p-tablist-content p-tablist-viewport`,tabList:`p-tablist-tab-list`,activeBar:`p-tablist-active-bar`,prevButton:`p-tablist-prev-button p-tablist-nav-button`,nextButton:`p-tablist-next-button p-tablist-nav-button`}}),provide:function(){return{$pcTabList:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`],data:function(){return{isPrevButtonEnabled:!1,isNextButtonEnabled:!0}},resizeObserver:void 0,watch:{showNavigators:function(e){e?this.bindResizeObserver():this.unbindResizeObserver()},activeValue:{flush:`post`,handler:function(){this.updateInkBar()}}},mounted:function(){var e=this;setTimeout(function(){e.updateInkBar()},150),this.showNavigators&&(this.updateButtonState(),this.bindResizeObserver())},updated:function(){this.showNavigators&&this.updateButtonState()},beforeUnmount:function(){this.unbindResizeObserver()},methods:{onScroll:function(e){this.showNavigators&&this.updateButtonState(),e.preventDefault()},onPrevButtonClick:function(){var e=this.$refs.content,t=this.getVisibleButtonWidths(),n=p(e)-t,r=Math.abs(e.scrollLeft)-n*.8,i=Math.max(r,0);e.scrollLeft=y(e)?-1*i:i},onNextButtonClick:function(){var e=this.$refs.content,t=this.getVisibleButtonWidths(),n=p(e)-t,r=Math.abs(e.scrollLeft)+n*.8,i=e.scrollWidth-n,a=Math.min(r,i);e.scrollLeft=y(e)?-1*a:a},bindResizeObserver:function(){var e=this;this.resizeObserver=new ResizeObserver(function(){return e.updateButtonState()}),this.resizeObserver.observe(this.$refs.list)},unbindResizeObserver:function(){var e;(e=this.resizeObserver)==null||e.unobserve(this.$refs.list),this.resizeObserver=void 0},updateInkBar:function(){var e=this.$refs,t=e.content,n=e.inkbar,r=e.tabs;if(n){var i=g(t,`[data-pc-name="tab"][data-p-active="true"]`);this.$pcTabs.isVertical()?(n.style.height=_(i)+`px`,n.style.top=w(i).top-w(r).top+`px`):(n.style.width=h(i)+`px`,n.style.left=w(i).left-w(r).left+`px`)}},updateButtonState:function(){var e=this.$refs,t=e.list,n=e.content,r=n.scrollTop,i=n.scrollWidth,a=n.scrollHeight,o=n.offsetWidth,s=n.offsetHeight,c=Math.abs(n.scrollLeft),l=[p(n),b(n)],u=l[0],d=l[1];this.$pcTabs.isVertical()?(this.isPrevButtonEnabled=r!==0,this.isNextButtonEnabled=t.offsetHeight>=s&&parseInt(r)!==a-d):(this.isPrevButtonEnabled=c!==0,this.isNextButtonEnabled=t.offsetWidth>=o&&parseInt(c)!==i-u)},getVisibleButtonWidths:function(){var e=this.$refs,t=e.prevButton,n=e.nextButton,r=0;return this.showNavigators&&(r=(t?.offsetWidth||0)+(n?.offsetWidth||0)),r}},computed:{templates:function(){return this.$pcTabs.$slots},activeValue:function(){return this.$pcTabs.d_value},showNavigators:function(){return this.$pcTabs.showNavigators},prevButtonAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.previous:void 0},nextButtonAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.next:void 0},dataP:function(){return m({scrollable:this.$pcTabs.scrollable})}},components:{ChevronLeftIcon:O,ChevronRightIcon:k},directives:{ripple:E}},P=[`data-p`],F=[`aria-label`,`tabindex`],I=[`data-p`],L=[`aria-orientation`],R=[`aria-label`,`tabindex`];function z(r,s,l,p,m,h){var g=t(`ripple`);return e(),d(`div`,f({ref:`list`,class:r.cx(`root`),"data-p":h.dataP},r.ptmi(`root`)),[h.showNavigators&&m.isPrevButtonEnabled?a((e(),d(`button`,f({key:0,ref:`prevButton`,type:`button`,class:r.cx(`prevButton`),"aria-label":h.prevButtonAriaLabel,tabindex:h.$pcTabs.tabindex,onClick:s[0]||=function(){return h.onPrevButtonClick&&h.onPrevButtonClick.apply(h,arguments)}},r.ptm(`prevButton`),{"data-pc-group-section":`navigator`}),[(e(),o(n(h.templates.previcon||`ChevronLeftIcon`),f({"aria-hidden":`true`},r.ptm(`prevIcon`)),null,16))],16,F)),[[g]]):c(``,!0),u(`div`,f({ref:`content`,class:r.cx(`content`),onScroll:s[1]||=function(){return h.onScroll&&h.onScroll.apply(h,arguments)},"data-p":h.dataP},r.ptm(`content`)),[u(`div`,f({ref:`tabs`,class:r.cx(`tabList`),role:`tablist`,"aria-orientation":h.$pcTabs.orientation||`horizontal`},r.ptm(`tabList`)),[i(r.$slots,`default`),u(`span`,f({ref:`inkbar`,class:r.cx(`activeBar`),role:`presentation`,"aria-hidden":`true`},r.ptm(`activeBar`)),null,16)],16,L)],16,I),h.showNavigators&&m.isNextButtonEnabled?a((e(),d(`button`,f({key:1,ref:`nextButton`,type:`button`,class:r.cx(`nextButton`),"aria-label":h.nextButtonAriaLabel,tabindex:h.$pcTabs.tabindex,onClick:s[2]||=function(){return h.onNextButtonClick&&h.onNextButtonClick.apply(h,arguments)}},r.ptm(`nextButton`),{"data-pc-group-section":`navigator`}),[(e(),o(n(h.templates.nexticon||`ChevronRightIcon`),f({"aria-hidden":`true`},r.ptm(`nextIcon`)),null,16))],16,R)),[[g]]):c(``,!0)],16,P)}N.render=z;var B=x.extend({name:`tab`,classes:{root:function(e){var t=e.instance,n=e.props;return[`p-tab`,{"p-tab-active":t.active,"p-disabled":n.disabled}]}}}),V={name:`Tab`,extends:{name:`BaseTab`,extends:S,props:{value:{type:[String,Number],default:void 0},disabled:{type:Boolean,default:!1},as:{type:[String,Object],default:`BUTTON`},asChild:{type:Boolean,default:!1}},style:B,provide:function(){return{$pcTab:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`,`$pcTabList`],methods:{onFocus:function(){this.$pcTabs.selectOnFocus&&this.changeActiveValue()},onClick:function(){this.changeActiveValue()},onKeydown:function(e){switch(e.code){case`ArrowRight`:this.onArrowRightKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:case`Space`:this.onEnterKey(e);break}},onArrowRightKey:function(e){var t=this.findNextTab(e.currentTarget);t?this.changeFocusedTab(e,t):this.onHomeKey(e),e.preventDefault()},onArrowLeftKey:function(e){var t=this.findPrevTab(e.currentTarget);t?this.changeFocusedTab(e,t):this.onEndKey(e),e.preventDefault()},onHomeKey:function(e){var t=this.findFirstTab();this.changeFocusedTab(e,t),e.preventDefault()},onEndKey:function(e){var t=this.findLastTab();this.changeFocusedTab(e,t),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.findLastTab()),e.preventDefault()},onPageUpKey:function(e){this.scrollInView(this.findFirstTab()),e.preventDefault()},onEnterKey:function(e){this.changeActiveValue()},findNextTab:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1]?e:e.nextElementSibling;return t?C(t,`data-p-disabled`)||C(t,`data-pc-section`)===`activebar`?this.findNextTab(t):g(t,`[data-pc-name="tab"]`):null},findPrevTab:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1]?e:e.previousElementSibling;return t?C(t,`data-p-disabled`)||C(t,`data-pc-section`)===`activebar`?this.findPrevTab(t):g(t,`[data-pc-name="tab"]`):null},findFirstTab:function(){return this.findNextTab(this.$pcTabList.$refs.tabs.firstElementChild,!0)},findLastTab:function(){return this.findPrevTab(this.$pcTabList.$refs.tabs.lastElementChild,!0)},changeActiveValue:function(){this.$pcTabs.updateValue(this.value)},changeFocusedTab:function(e,t){T(t),this.scrollInView(t)},scrollInView:function(e){var t;e==null||(t=e.scrollIntoView)==null||t.call(e,{block:`nearest`})}},computed:{active:function(){return v(this.$pcTabs?.d_value,this.value)},id:function(){return`${this.$pcTabs?.$id}_tab_${this.value}`},ariaControls:function(){return`${this.$pcTabs?.$id}_tabpanel_${this.value}`},attrs:function(){return f(this.asAttrs,this.a11yAttrs,this.ptmi(`root`,this.ptParams))},asAttrs:function(){return this.as===`BUTTON`?{type:`button`,disabled:this.disabled}:void 0},a11yAttrs:function(){return{id:this.id,tabindex:this.active?this.$pcTabs.tabindex:-1,role:`tab`,"aria-selected":this.active,"aria-controls":this.ariaControls,"data-pc-name":`tab`,"data-p-disabled":this.disabled,"data-p-active":this.active,onFocus:this.onFocus,onKeydown:this.onKeydown}},ptParams:function(){return{context:{active:this.active}}},dataP:function(){return m({active:this.active})}},directives:{ripple:E}};function H(c,l,u,d,p,m){var h=t(`ripple`);return c.asChild?i(c.$slots,`default`,{key:1,dataP:m.dataP,class:s(c.cx(`root`)),active:m.active,a11yAttrs:m.a11yAttrs,onClick:m.onClick}):a((e(),o(n(c.as),f({key:0,class:c.cx(`root`),"data-p":m.dataP,onClick:m.onClick},m.attrs),{default:r(function(){return[i(c.$slots,`default`)]}),_:3},16,[`class`,`data-p`,`onClick`])),[[h]])}V.render=H;var U={name:`TabPanels`,extends:{name:`BaseTabPanels`,extends:S,props:{},style:x.extend({name:`tabpanels`,classes:{root:`p-tabpanels`}}),provide:function(){return{$pcTabPanels:this,$parentInstance:this}}},inheritAttrs:!1};function W(t,n,r,a,o,s){return e(),d(`div`,f({class:t.cx(`root`),role:`presentation`},t.ptmi(`root`)),[i(t.$slots,`default`)],16)}U.render=W;var G=x.extend({name:`tabpanel`,classes:{root:function(e){return[`p-tabpanel`,{"p-tabpanel-active":e.instance.active}]}}}),K={name:`TabPanel`,extends:{name:`BaseTabPanel`,extends:S,props:{value:{type:[String,Number],default:void 0},as:{type:[String,Object],default:`DIV`},asChild:{type:Boolean,default:!1},header:null,headerStyle:null,headerClass:null,headerProps:null,headerActionProps:null,contentStyle:null,contentClass:null,contentProps:null,disabled:Boolean},style:G,provide:function(){return{$pcTabPanel:this,$parentInstance:this}}},inheritAttrs:!1,inject:[`$pcTabs`],computed:{active:function(){return v(this.$pcTabs?.d_value,this.value)},id:function(){return`${this.$pcTabs?.$id}_tabpanel_${this.value}`},ariaLabelledby:function(){return`${this.$pcTabs?.$id}_tab_${this.value}`},attrs:function(){return f(this.a11yAttrs,this.ptmi(`root`,this.ptParams))},a11yAttrs:function(){return{id:this.id,tabindex:this.$pcTabs?.tabindex,role:`tabpanel`,"aria-labelledby":this.ariaLabelledby,"data-pc-name":`tabpanel`,"data-p-active":this.active}},ptParams:function(){return{context:{active:this.active}}}}};function q(t,u,p,m,h,g){var _,v;return g.$pcTabs?(e(),d(l,{key:1},[t.asChild?i(t.$slots,`default`,{key:1,class:s(t.cx(`root`)),active:g.active,a11yAttrs:g.a11yAttrs}):(e(),d(l,{key:0},[!((_=g.$pcTabs)!=null&&_.lazy)||g.active?a((e(),o(n(t.as),f({key:0,class:t.cx(`root`)},g.attrs),{default:r(function(){return[i(t.$slots,`default`)]}),_:3},16,[`class`])),[[D,(v=g.$pcTabs)!=null&&v.lazy?!0:g.active]]):c(``,!0)],64))],64)):i(t.$slots,`default`,{key:0})}K.render=q;export{j as a,N as i,U as n,V as r,K as t};
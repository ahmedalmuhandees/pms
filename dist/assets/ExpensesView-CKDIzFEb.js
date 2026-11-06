import{$ as e,A as t,D as n,F as r,G as i,I as a,J as o,M as s,Mt as c,N as l,P as u,Y as d,c as f,dt as p,f as m,g as h,h as g,it as _,jt as v,kt as y,l as b,m as x,nt as ee,o as te,r as S,s as C,u as w,w as T}from"./runtime-core.esm-bundler-Dhk7EoYY.js";import{D as ne,F as E,Q as D,Y as O,Z as k,at as A,f as j,g as re,gt as ie,ht as ae,r as oe,xt as M,yt as N,z as P}from"./basecomponent-COb0tzgW.js";import{i as F,r as I,t as L}from"./button-Ik5BKO1o.js";import{Ct as R,Et as z,Ft as B,Pt as V,St as H,Tt as U,_ as se,c as ce,mt as le,o as W,t as ue,v as de,vt as G,xt as fe}from"./index-C5zNCBEs.js";import{t as pe}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{t as me}from"./overlayeventbus-DlcdQrCm.js";import{t as he}from"./textarea-RSrayLVp.js";import{n as K,o as ge,t as q}from"./select-B2wm89no.js";import{t as _e}from"./datepicker-B_GCaeBl.js";import{n as ve,t as J}from"./column-DM2ICRel.js";import{r as ye}from"./complexes-B0KA4ADK.js";import{n as be,t as xe}from"./useNotify-YOJyomYT.js";import{t as Se}from"./FilterBar-DbRXoLuy.js";import{t as Ce}from"./usePagedList-DlkPatSq.js";import{t as we}from"./PageHeader-BJdmWiHI.js";import{n as Te,t as Ee}from"./TableSkeleton-DApH7Ddi.js";import{t as De}from"./RowActions-CbH1YFAM.js";import{n as Oe}from"./media-7Pr6NmV1.js";import{a as ke,n as Ae,o as je,r as Me,t as Ne}from"./expenses-BYtZnJEA.js";import{t as Pe}from"./chip-Cxe-kwwF.js";var Fe=oe.extend({name:`autocomplete`,style:`
    .p-autocomplete {
        display: inline-flex;
    }

    .p-autocomplete-loader {
        position: absolute;
        top: 50%;
        margin-top: -0.5rem;
        inset-inline-end: dt('autocomplete.padding.x');
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-loader {
        inset-inline-end: calc(dt('autocomplete.dropdown.width') + dt('autocomplete.padding.x'));
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input {
        flex: 1 1 auto;
        width: 1%;
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input,
    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input-multiple {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-autocomplete-dropdown {
        cursor: pointer;
        display: inline-flex;
        user-select: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        width: dt('autocomplete.dropdown.width');
        border-start-end-radius: dt('autocomplete.dropdown.border.radius');
        border-end-end-radius: dt('autocomplete.dropdown.border.radius');
        background: dt('autocomplete.dropdown.background');
        border: 1px solid dt('autocomplete.dropdown.border.color');
        border-inline-start: 0 none;
        color: dt('autocomplete.dropdown.color');
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration'),
            outline-color dt('autocomplete.transition.duration'),
            box-shadow dt('autocomplete.transition.duration');
        outline-color: transparent;
    }

    .p-autocomplete-dropdown:not(:disabled):hover {
        background: dt('autocomplete.dropdown.hover.background');
        border-color: dt('autocomplete.dropdown.hover.border.color');
        color: dt('autocomplete.dropdown.hover.color');
    }

    .p-autocomplete-dropdown:not(:disabled):active {
        background: dt('autocomplete.dropdown.active.background');
        border-color: dt('autocomplete.dropdown.active.border.color');
        color: dt('autocomplete.dropdown.active.color');
    }

    .p-autocomplete-dropdown:focus-visible {
        box-shadow: dt('autocomplete.dropdown.focus.ring.shadow');
        outline: dt('autocomplete.dropdown.focus.ring.width') dt('autocomplete.dropdown.focus.ring.style') dt('autocomplete.dropdown.focus.ring.color');
        outline-offset: dt('autocomplete.dropdown.focus.ring.offset');
    }

    .p-autocomplete-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('autocomplete.overlay.background');
        color: dt('autocomplete.overlay.color');
        border: 1px solid dt('autocomplete.overlay.border.color');
        border-radius: dt('autocomplete.overlay.border.radius');
        box-shadow: dt('autocomplete.overlay.shadow');
        min-width: 100%;
    }

    .p-autocomplete-list-container {
        overflow: auto;
    }

    .p-autocomplete-list {
        margin: 0;
        list-style-type: none;
        display: flex;
        flex-direction: column;
        gap: dt('autocomplete.list.gap');
        padding: dt('autocomplete.list.padding');
    }

    .p-autocomplete-option {
        cursor: pointer;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: dt('autocomplete.option.padding');
        border: 0 none;
        color: dt('autocomplete.option.color');
        background: transparent;
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration');
        border-radius: dt('autocomplete.option.border.radius');
    }

    .p-autocomplete-option:not(.p-autocomplete-option-selected):not(.p-disabled).p-focus {
        background: dt('autocomplete.option.focus.background');
        color: dt('autocomplete.option.focus.color');
    }

    .p-autocomplete-option:not(.p-autocomplete-option-selected):not(.p-disabled):hover {
        background: dt('autocomplete.option.focus.background');
        color: dt('autocomplete.option.focus.color');
    }

    .p-autocomplete-option-selected {
        background: dt('autocomplete.option.selected.background');
        color: dt('autocomplete.option.selected.color');
    }

    .p-autocomplete-option-selected.p-focus {
        background: dt('autocomplete.option.selected.focus.background');
        color: dt('autocomplete.option.selected.focus.color');
    }

    .p-autocomplete-option-group {
        margin: 0;
        padding: dt('autocomplete.option.group.padding');
        color: dt('autocomplete.option.group.color');
        background: dt('autocomplete.option.group.background');
        font-weight: dt('autocomplete.option.group.font.weight');
    }

    .p-autocomplete-input-multiple {
        margin: 0;
        list-style-type: none;
        cursor: text;
        overflow: hidden;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        padding: calc(dt('autocomplete.padding.y') / 2) dt('autocomplete.padding.x');
        gap: calc(dt('autocomplete.padding.y') / 2);
        color: dt('autocomplete.color');
        background: dt('autocomplete.background');
        border: 1px solid dt('autocomplete.border.color');
        border-radius: dt('autocomplete.border.radius');
        width: 100%;
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration'),
            outline-color dt('autocomplete.transition.duration'),
            box-shadow dt('autocomplete.transition.duration');
        outline-color: transparent;
        box-shadow: dt('autocomplete.shadow');
    }

    .p-autocomplete-input-multiple.p-disabled {
        opacity: 1;
        background: dt('autocomplete.disabled.background');
        color: dt('autocomplete.disabled.color');
    }

    .p-autocomplete-input-multiple:not(.p-disabled):hover {
        border-color: dt('autocomplete.hover.border.color');
    }

    .p-autocomplete.p-focus .p-autocomplete-input-multiple:not(.p-disabled) {
        border-color: dt('autocomplete.focus.border.color');
        box-shadow: dt('autocomplete.focus.ring.shadow');
        outline: dt('autocomplete.focus.ring.width') dt('autocomplete.focus.ring.style') dt('autocomplete.focus.ring.color');
        outline-offset: dt('autocomplete.focus.ring.offset');
    }

    .p-autocomplete.p-invalid .p-autocomplete-input-multiple {
        border-color: dt('autocomplete.invalid.border.color');
    }

    .p-variant-filled.p-autocomplete-input-multiple {
        background: dt('autocomplete.filled.background');
    }

    .p-autocomplete-input-multiple.p-variant-filled:not(.p-disabled):hover {
        background: dt('autocomplete.filled.hover.background');
    }

    .p-autocomplete.p-focus .p-autocomplete-input-multiple.p-variant-filled:not(.p-disabled) {
        background: dt('autocomplete.filled.focus.background');
    }

    .p-autocomplete-chip.p-chip {
        padding-block-start: calc(dt('autocomplete.padding.y') / 2);
        padding-block-end: calc(dt('autocomplete.padding.y') / 2);
        border-radius: dt('autocomplete.chip.border.radius');
    }

    .p-autocomplete-input-multiple:has(.p-autocomplete-chip) {
        padding-inline-start: calc(dt('autocomplete.padding.y') / 2);
        padding-inline-end: calc(dt('autocomplete.padding.y') / 2);
    }

    .p-autocomplete-chip-item.p-focus .p-autocomplete-chip {
        background: dt('autocomplete.chip.focus.background');
        color: dt('autocomplete.chip.focus.color');
    }

    .p-autocomplete-input-chip {
        flex: 1 1 auto;
        display: inline-flex;
        padding-block-start: calc(dt('autocomplete.padding.y') / 2);
        padding-block-end: calc(dt('autocomplete.padding.y') / 2);
    }

    .p-autocomplete-input-chip input {
        border: 0 none;
        outline: 0 none;
        background: transparent;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border-radius: 0;
        width: 100%;
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: inherit;
    }

    .p-autocomplete-input-chip input::placeholder {
        color: dt('autocomplete.placeholder.color');
    }

    .p-autocomplete.p-invalid .p-autocomplete-input-chip input::placeholder {
        color: dt('autocomplete.invalid.placeholder.color');
    }

    .p-autocomplete-empty-message {
        padding: dt('autocomplete.empty.message.padding');
    }

    .p-autocomplete-fluid {
        display: flex;
    }

    .p-autocomplete-fluid:has(.p-autocomplete-dropdown) .p-autocomplete-input {
        width: 1%;
    }

    .p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-dropdown {
        width: dt('autocomplete.dropdown.sm.width');
    }

    .p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-dropdown .p-icon {
        font-size: dt('form.field.sm.font.size');
        width: dt('form.field.sm.font.size');
        height: dt('form.field.sm.font.size');
    }

    .p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-dropdown {
        width: dt('autocomplete.dropdown.lg.width');
    }

    .p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-dropdown .p-icon {
        font-size: dt('form.field.lg.font.size');
        width: dt('form.field.lg.font.size');
        height: dt('form.field.lg.font.size');
    }

    .p-autocomplete-clear-icon {
        position: absolute;
        top: 50%;
        margin-top: -0.5rem;
        cursor: pointer;
        color: dt('form.field.icon.color');
        inset-inline-end: dt('autocomplete.padding.x');
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-clear-icon {
        inset-inline-end: calc(dt('autocomplete.padding.x') + dt('autocomplete.dropdown.width'));
    }

    .p-autocomplete:has(.p-autocomplete-clear-icon) .p-autocomplete-input {
        padding-inline-end: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-inputgroup .p-autocomplete-dropdown {
        border-radius: 0;
    }

    .p-inputgroup > .p-autocomplete:last-child:has(.p-autocomplete-dropdown) > .p-autocomplete-input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-inputgroup > .p-autocomplete:last-child .p-autocomplete-dropdown {
        border-start-end-radius: dt('autocomplete.dropdown.border.radius');
        border-end-end-radius: dt('autocomplete.dropdown.border.radius');
    }
`,classes:{root:function(e){var t=e.instance;return[`p-autocomplete p-component p-inputwrapper`,{"p-invalid":t.$invalid,"p-focus":t.focused,"p-inputwrapper-filled":t.$filled||M(t.inputValue),"p-inputwrapper-focus":t.focused,"p-autocomplete-open":t.overlayVisible,"p-autocomplete-fluid":t.$fluid,"p-autocomplete-clearable":t.isClearIconVisible}]},pcInputText:`p-autocomplete-input`,inputMultiple:function(e){var t=e.instance,n=e.props;return[`p-autocomplete-input-multiple`,{"p-variant-filled":t.$variant===`filled`,"p-disabled":n.disabled}]},clearIcon:`p-autocomplete-clear-icon`,chipItem:function(e){var t=e.instance,n=e.i;return[`p-autocomplete-chip-item`,{"p-focus":t.focusedMultipleOptionIndex===n}]},pcChip:`p-autocomplete-chip`,chipIcon:`p-autocomplete-chip-icon`,inputChip:`p-autocomplete-input-chip`,loader:`p-autocomplete-loader`,dropdown:`p-autocomplete-dropdown`,overlay:`p-autocomplete-overlay p-component`,listContainer:`p-autocomplete-list-container`,list:`p-autocomplete-list`,optionGroup:`p-autocomplete-option-group`,option:function(e){var t=e.instance,n=e.option,r=e.i,i=e.getItemOptions;return[`p-autocomplete-option`,{"p-autocomplete-option-selected":t.isSelected(n),"p-focus":t.focusedOptionIndex===t.getOptionIndex(r,i),"p-disabled":t.isOptionDisabled(n)}]},emptyMessage:`p-autocomplete-empty-message`},inlineStyles:{root:{position:`relative`}}}),Ie={name:`BaseAutoComplete`,extends:R,props:{suggestions:{type:Array,default:null},optionLabel:null,optionDisabled:null,optionGroupLabel:null,optionGroupChildren:null,scrollHeight:{type:String,default:`14rem`},dropdown:{type:Boolean,default:!1},dropdownMode:{type:String,default:`blank`},multiple:{type:Boolean,default:!1},loading:{type:Boolean,default:!1},placeholder:{type:String,default:null},dataKey:{type:String,default:null},minLength:{type:Number,default:1},delay:{type:Number,default:300},appendTo:{type:[String,Object],default:`body`},forceSelection:{type:Boolean,default:!1},completeOnFocus:{type:Boolean,default:!1},showClear:{type:Boolean,default:!1},inputId:{type:String,default:null},inputStyle:{type:Object,default:null},inputClass:{type:[String,Object],default:null},panelStyle:{type:Object,default:null},panelClass:{type:[String,Object],default:null},overlayStyle:{type:Object,default:null},overlayClass:{type:[String,Object],default:null},dropdownIcon:{type:String,default:null},dropdownClass:{type:[String,Object],default:null},loader:{type:String,default:null},loadingIcon:{type:String,default:null},removeTokenIcon:{type:String,default:null},chipIcon:{type:String,default:null},virtualScrollerOptions:{type:Object,default:null},autoOptionFocus:{type:Boolean,default:!1},selectOnFocus:{type:Boolean,default:!1},focusOnHover:{type:Boolean,default:!0},searchLocale:{type:String,default:void 0},searchMessage:{type:String,default:null},selectionMessage:{type:String,default:null},emptySelectionMessage:{type:String,default:null},emptySearchMessage:{type:String,default:null},showEmptyMessage:{type:Boolean,default:!0},tabindex:{type:Number,default:0},typeahead:{type:Boolean,default:!0},ariaLabel:{type:String,default:null},ariaLabelledby:{type:String,default:null}},style:Fe,provide:function(){return{$pcAutoComplete:this,$parentInstance:this}}};function Y(e,t,n){return(t=Le(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Le(e){var t=Re(e,`string`);return X(t)==`symbol`?t:t+``}function Re(e,t){if(X(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(X(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function X(e){"@babel/helpers - typeof";return X=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},X(e)}function Z(e){return He(e)||Ve(e)||Be(e)||ze()}function ze(){throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Be(e,t){if(e){if(typeof e==`string`)return Q(e,t);var n={}.toString.call(e).slice(8,-1);return n===`Object`&&e.constructor&&(n=e.constructor.name),n===`Map`||n===`Set`?Array.from(e):n===`Arguments`||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Q(e,t):void 0}}function Ve(e){if(typeof Symbol<`u`&&e[Symbol.iterator]!=null||e[`@@iterator`]!=null)return Array.from(e)}function He(e){if(Array.isArray(e))return Q(e)}function Q(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}var Ue={name:`AutoComplete`,extends:Ie,inheritAttrs:!1,emits:[`change`,`focus`,`blur`,`item-select`,`item-unselect`,`option-select`,`option-unselect`,`dropdown-click`,`clear`,`complete`,`before-show`,`before-hide`,`show`,`hide`],inject:{$pcFluid:{default:null}},outsideClickListener:null,resizeListener:null,scrollHandler:null,overlay:null,virtualScroller:null,searchTimeout:null,dirty:!1,startRangeIndex:-1,data:function(){return{clicked:!1,focused:!1,focusedOptionIndex:-1,focusedMultipleOptionIndex:-1,overlayVisible:!1,searching:!1}},watch:{suggestions:function(){this.searching&&(this.show(),this.focusedOptionIndex=this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1,this.searching=!1,!this.showEmptyMessage&&this.visibleOptions.length===0&&this.hide()),this.autoUpdateModel()}},mounted:function(){this.autoUpdateModel()},updated:function(){this.overlayVisible&&this.alignOverlay()},beforeUnmount:function(){this.unbindOutsideClickListener(),this.unbindResizeListener(),this.scrollHandler&&=(this.scrollHandler.destroy(),null),this.overlay&&=(V.clear(this.overlay),null)},methods:{getOptionIndex:function(e,t){return this.virtualScrollerDisabled?e:t&&t(e).index},getOptionLabel:function(e){return this.optionLabel?N(e,this.optionLabel):e},getOptionValue:function(e){return e},getOptionRenderKey:function(e,t){return(this.dataKey?N(e,this.dataKey):this.getOptionLabel(e))+`_`+t},getPTOptions:function(e,t,n,r){return this.ptm(r,{context:{option:e,index:n,selected:this.isSelected(e),focused:this.focusedOptionIndex===this.getOptionIndex(n,t),disabled:this.isOptionDisabled(e)}})},isOptionDisabled:function(e){return this.optionDisabled?N(e,this.optionDisabled):!1},isOptionGroup:function(e){return this.optionGroupLabel&&e.optionGroup&&e.group},getOptionGroupLabel:function(e){return N(e,this.optionGroupLabel)},getOptionGroupChildren:function(e){return N(e,this.optionGroupChildren)},getAriaPosInset:function(e){var t=this;return(this.optionGroupLabel?e-this.visibleOptions.slice(0,e).filter(function(e){return t.isOptionGroup(e)}).length:e)+1},show:function(e){this.$emit(`before-show`),this.dirty=!0,this.overlayVisible=!0,this.focusedOptionIndex=this.focusedOptionIndex===-1?this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,e&&P(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},hide:function(e){var t=this,n=function(){t.$emit(`before-hide`),t.dirty=e,t.overlayVisible=!1,t.clicked=!1,t.focusedOptionIndex=-1,e&&P(t.multiple?t.$refs.focusInput:t.$refs.focusInput?.$el)};setTimeout(function(){n()},0)},onFocus:function(e){this.disabled||(!this.dirty&&this.completeOnFocus&&this.search(e,e.target.value,`focus`),this.dirty=!0,this.focused=!0,this.overlayVisible&&(this.focusedOptionIndex=this.focusedOptionIndex===-1?this.overlayVisible&&this.autoOptionFocus?this.findFirstFocusedOptionIndex():-1:this.focusedOptionIndex,this.scrollInView(this.focusedOptionIndex)),this.$emit(`focus`,e))},onBlur:function(e){var t,n;this.dirty=!1,this.focused=!1,this.focusedOptionIndex=-1,this.$emit(`blur`,e),(t=(n=this.formField).onBlur)==null||t.call(n)},onKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(e.code){case`ArrowDown`:this.onArrowDownKey(e);break;case`ArrowUp`:this.onArrowUpKey(e);break;case`ArrowLeft`:this.onArrowLeftKey(e);break;case`ArrowRight`:this.onArrowRightKey(e);break;case`Home`:this.onHomeKey(e);break;case`End`:this.onEndKey(e);break;case`PageDown`:this.onPageDownKey(e);break;case`PageUp`:this.onPageUpKey(e);break;case`Enter`:case`NumpadEnter`:this.onEnterKey(e);break;case`Space`:this.onSpaceKey(e);break;case`Escape`:this.onEscapeKey(e);break;case`Tab`:this.onTabKey(e);break;case`ShiftLeft`:case`ShiftRight`:this.onShiftKey(e);break;case`Backspace`:this.onBackspaceKey(e);break}this.clicked=!1},onInput:function(e){var t=this;if(this.typeahead){this.searchTimeout&&clearTimeout(this.searchTimeout);var n=e.target.value;this.multiple||this.updateModel(e,n),n.length===0?(this.searching=!1,this.hide(),this.$emit(`clear`)):n.length>=this.minLength?(this.focusedOptionIndex=-1,this.searchTimeout=setTimeout(function(){t.search(e,n,`input`)},this.delay)):(this.searching=!1,this.hide())}},onChange:function(e){var t=this;if(this.forceSelection){var n=!1;if(this.visibleOptions&&!this.multiple){var r,i=this.multiple?this.$refs.focusInput.value:(r=this.$refs.focusInput)==null||(r=r.$el)==null?void 0:r.value,a=this.visibleOptions.find(function(e){return t.isOptionMatched(e,i||``)});a!==void 0&&(n=!0,!this.isSelected(a)&&this.onOptionSelect(e,a))}if(!n){if(this.multiple)this.$refs.focusInput.value=``;else{var o=this.$refs.focusInput?.$el;o&&(o.value=``)}this.$emit(`clear`),!this.multiple&&this.updateModel(e,null)}}},onMultipleContainerFocus:function(){this.disabled||(this.focused=!0)},onMultipleContainerBlur:function(){this.focusedMultipleOptionIndex=-1,this.focused=!1},onMultipleContainerKeyDown:function(e){if(this.disabled){e.preventDefault();return}switch(e.code){case`ArrowLeft`:this.onArrowLeftKeyOnMultiple(e);break;case`ArrowRight`:this.onArrowRightKeyOnMultiple(e);break;case`Backspace`:this.onBackspaceKeyOnMultiple(e);break}},onContainerClick:function(e){this.clicked=!0,!(this.disabled||this.searching||this.loading||this.isDropdownClicked(e))&&(!this.overlay||!this.overlay.contains(e.target))&&P(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},onDropdownClick:function(e){var t=void 0;if(this.overlayVisible)this.hide(!0);else{var n=this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el;P(n),t=n.value,this.dropdownMode===`blank`?this.search(e,``,`dropdown`):this.dropdownMode===`current`&&this.search(e,t,`dropdown`)}this.$emit(`dropdown-click`,{originalEvent:e,query:t})},onOptionSelect:function(e,t){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!0,r=this.getOptionValue(t);this.multiple?(this.$refs.focusInput.value=``,this.isSelected(t)||this.updateModel(e,[].concat(Z(this.d_value||[]),[r]))):this.updateModel(e,r),this.$emit(`item-select`,{originalEvent:e,value:t}),this.$emit(`option-select`,{originalEvent:e,value:t}),n&&this.hide(!0)},onOptionMouseMove:function(e,t){this.focusOnHover&&this.changeFocusedOptionIndex(e,t)},onOptionSelectRange:function(e){var t=this,n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:-1,r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:-1;if(n===-1&&(n=this.findNearestSelectedOptionIndex(r,!0)),r===-1&&(r=this.findNearestSelectedOptionIndex(n)),n!==-1&&r!==-1){var i=Math.min(n,r),a=Math.max(n,r),o=this.visibleOptions.slice(i,a+1).filter(function(e){return t.isValidOption(e)}).filter(function(e){return!t.isSelected(e)}).map(function(e){return t.getOptionValue(e)});this.updateModel(e,[].concat(Z(this.d_value||[]),Z(o)))}},onClearClick:function(e){this.updateModel(e,null)},onOverlayClick:function(e){me.emit(`overlay-click`,{originalEvent:e,target:this.$el})},onOverlayKeyDown:function(e){switch(e.code){case`Escape`:this.onEscapeKey(e);break}},onArrowDownKey:function(e){if(this.overlayVisible){var t=this.focusedOptionIndex===-1?this.clicked?this.findFirstOptionIndex():this.findFirstFocusedOptionIndex():this.findNextOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,this.startRangeIndex,t),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowUpKey:function(e){if(this.overlayVisible)if(e.altKey)this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide(),e.preventDefault();else{var t=this.focusedOptionIndex===-1?this.clicked?this.findLastOptionIndex():this.findLastFocusedOptionIndex():this.findPrevOptionIndex(this.focusedOptionIndex);this.multiple&&e.shiftKey&&this.onOptionSelectRange(e,t,this.startRangeIndex),this.changeFocusedOptionIndex(e,t),e.preventDefault()}},onArrowLeftKey:function(e){var t=e.currentTarget;this.focusedOptionIndex=-1,this.multiple&&(ie(t.value)&&this.$filled?(P(this.$refs.multiContainer),this.focusedMultipleOptionIndex=this.d_value.length):e.stopPropagation())},onArrowRightKey:function(e){this.focusedOptionIndex=-1,this.multiple&&e.stopPropagation()},onHomeKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findFirstOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,i,this.startRangeIndex),t.setSelectionRange(0,e.shiftKey?n:0),this.focusedOptionIndex=-1,e.preventDefault()},onEndKey:function(e){var t=e.currentTarget,n=t.value.length,r=e.metaKey||e.ctrlKey,i=this.findLastOptionIndex();this.multiple&&e.shiftKey&&r&&this.onOptionSelectRange(e,this.startRangeIndex,i),t.setSelectionRange(e.shiftKey?0:n,n),this.focusedOptionIndex=-1,e.preventDefault()},onPageUpKey:function(e){this.scrollInView(0),e.preventDefault()},onPageDownKey:function(e){this.scrollInView(this.visibleOptions.length-1),e.preventDefault()},onEnterKey:function(e){this.typeahead?this.overlayVisible?(this.focusedOptionIndex!==-1&&(this.multiple&&e.shiftKey?(this.onOptionSelectRange(e,this.focusedOptionIndex),e.preventDefault()):this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex])),this.hide()):(this.focusedOptionIndex=-1,this.onArrowDownKey(e)):this.multiple&&(e.target.value.trim()&&(this.updateModel(e,[].concat(Z(this.d_value||[]),[e.target.value.trim()])),this.$refs.focusInput.value=``),e.preventDefault())},onSpaceKey:function(e){!this.autoOptionFocus&&this.focusedOptionIndex!==-1&&this.onEnterKey(e)},onEscapeKey:function(e){this.overlayVisible&&this.hide(!0),e.preventDefault()},onTabKey:function(e){this.focusedOptionIndex!==-1&&this.onOptionSelect(e,this.visibleOptions[this.focusedOptionIndex]),this.overlayVisible&&this.hide()},onShiftKey:function(){this.startRangeIndex=this.focusedOptionIndex},onBackspaceKey:function(e){if(this.multiple){if(M(this.d_value)&&!this.$refs.focusInput.value){var t=this.d_value[this.d_value.length-1],n=this.d_value.slice(0,-1);this.writeValue(n,e),this.$emit(`item-unselect`,{originalEvent:e,value:t}),this.$emit(`option-unselect`,{originalEvent:e,value:t})}e.stopPropagation()}},onArrowLeftKeyOnMultiple:function(){this.focusedMultipleOptionIndex=this.focusedMultipleOptionIndex<1?0:this.focusedMultipleOptionIndex-1},onArrowRightKeyOnMultiple:function(){this.focusedMultipleOptionIndex++,this.focusedMultipleOptionIndex>this.d_value.length-1&&(this.focusedMultipleOptionIndex=-1,P(this.$refs.focusInput))},onBackspaceKeyOnMultiple:function(e){this.focusedMultipleOptionIndex!==-1&&this.removeOption(e,this.focusedMultipleOptionIndex)},onOverlayEnter:function(e){V.set(`overlay`,e,this.$primevue.config.zIndex.overlay),ne(e,{position:`absolute`,top:`0`}),this.alignOverlay(),this.$attrSelector&&e.setAttribute(this.$attrSelector,``)},onOverlayAfterEnter:function(){this.bindOutsideClickListener(),this.bindScrollListener(),this.bindResizeListener(),this.$emit(`show`)},onOverlayLeave:function(){this.unbindOutsideClickListener(),this.unbindScrollListener(),this.unbindResizeListener(),this.$emit(`hide`),this.overlay=null},onOverlayAfterLeave:function(e){V.clear(e)},alignOverlay:function(){var e=this.multiple?this.$refs.multiContainer:this.$refs.focusInput.$el;this.appendTo===`self`?re(this.overlay,e):(this.overlay.style.minWidth=O(e)+`px`,j(this.overlay,e))},bindOutsideClickListener:function(){var e=this;this.outsideClickListener||(this.outsideClickListener=function(t){e.overlayVisible&&e.overlay&&e.isOutsideClicked(t)&&e.hide()},document.addEventListener(`click`,this.outsideClickListener,!0))},unbindOutsideClickListener:function(){this.outsideClickListener&&=(document.removeEventListener(`click`,this.outsideClickListener,!0),null)},bindScrollListener:function(){var e=this;this.scrollHandler||=new z(this.$refs.container,function(){e.overlayVisible&&e.hide()}),this.scrollHandler.bindScrollListener()},unbindScrollListener:function(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()},bindResizeListener:function(){var e=this;this.resizeListener||(this.resizeListener=function(){e.overlayVisible&&!E()&&e.hide()},window.addEventListener(`resize`,this.resizeListener))},unbindResizeListener:function(){this.resizeListener&&=(window.removeEventListener(`resize`,this.resizeListener),null)},isOutsideClicked:function(e){return!this.overlay.contains(e.target)&&!this.isInputClicked(e)&&!this.isDropdownClicked(e)},isInputClicked:function(e){return this.multiple?e.target===this.$refs.multiContainer||this.$refs.multiContainer.contains(e.target):e.target===this.$refs.focusInput.$el},isDropdownClicked:function(e){return this.$refs.dropdownButton?e.target===this.$refs.dropdownButton||this.$refs.dropdownButton.contains(e.target):!1},isOptionMatched:function(e,t){return this.isValidOption(e)&&this.getOptionLabel(e)?.toLocaleLowerCase(this.searchLocale)===t.toLocaleLowerCase(this.searchLocale)},isValidOption:function(e){return M(e)&&!(this.isOptionDisabled(e)||this.isOptionGroup(e))},isValidSelectedOption:function(e){return this.isValidOption(e)&&this.isSelected(e)},isEquals:function(e,t){return ae(e,t,this.equalityKey)},isSelected:function(e){var t=this,n=this.getOptionValue(e);return this.multiple?(this.d_value||[]).some(function(e){return t.isEquals(e,n)}):this.isEquals(this.d_value,this.getOptionValue(e))},findFirstOptionIndex:function(){var e=this;return this.visibleOptions.findIndex(function(t){return e.isValidOption(t)})},findLastOptionIndex:function(){var e=this;return A(this.visibleOptions,function(t){return e.isValidOption(t)})},findNextOptionIndex:function(e){var t=this,n=e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidOption(e)}):-1;return n>-1?n+e+1:e},findPrevOptionIndex:function(e){var t=this,n=e>0?A(this.visibleOptions.slice(0,e),function(e){return t.isValidOption(e)}):-1;return n>-1?n:e},findSelectedOptionIndex:function(){var e=this;return this.$filled?this.visibleOptions.findIndex(function(t){return e.isValidSelectedOption(t)}):-1},findFirstFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findFirstOptionIndex():e},findLastFocusedOptionIndex:function(){var e=this.findSelectedOptionIndex();return e<0?this.findLastOptionIndex():e},search:function(e,t,n){t!=null&&(n===`input`&&t.trim().length===0||(this.searching=!0,this.$emit(`complete`,{originalEvent:e,query:t})))},removeOption:function(e,t){var n=this,r=this.d_value[t],i=this.d_value.filter(function(e,n){return n!==t}).map(function(e){return n.getOptionValue(e)});this.updateModel(e,i),this.$emit(`item-unselect`,{originalEvent:e,value:r}),this.$emit(`option-unselect`,{originalEvent:e,value:r}),this.dirty=!0,P(this.multiple?this.$refs.focusInput:this.$refs.focusInput.$el)},changeFocusedOptionIndex:function(e,t){this.focusedOptionIndex!==t&&(this.focusedOptionIndex=t,this.scrollInView(),this.selectOnFocus&&this.onOptionSelect(e,this.visibleOptions[t],!1))},scrollInView:function(){var e=this,t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:-1;this.$nextTick(function(){var n=t===-1?e.focusedOptionId:`${e.$id}_${t}`,r=k(e.list,`li[id="${n}"]`);r?r.scrollIntoView&&r.scrollIntoView({block:`nearest`,inline:`start`}):e.virtualScrollerDisabled||e.virtualScroller&&e.virtualScroller.scrollToIndex(t===-1?e.focusedOptionIndex:t)})},autoUpdateModel:function(){this.selectOnFocus&&this.autoOptionFocus&&!this.$filled&&(this.focusedOptionIndex=this.findFirstFocusedOptionIndex(),this.onOptionSelect(null,this.visibleOptions[this.focusedOptionIndex],!1))},updateModel:function(e,t){this.writeValue(t,e),this.$emit(`change`,{originalEvent:e,value:t})},flatOptions:function(e){var t=this;return(e||[]).reduce(function(e,n,r){e.push({optionGroup:n,group:!0,index:r});var i=t.getOptionGroupChildren(n);return i&&i.forEach(function(t){return e.push(t)}),e},[])},overlayRef:function(e){this.overlay=e},listRef:function(e,t){this.list=e,t&&t(e)},virtualScrollerRef:function(e){this.virtualScroller=e},findNextSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e<this.visibleOptions.length-1?this.visibleOptions.slice(e+1).findIndex(function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n+e+1:-1},findPrevSelectedOptionIndex:function(e){var t=this,n=this.$filled&&e>0?A(this.visibleOptions.slice(0,e),function(e){return t.isValidSelectedOption(e)}):-1;return n>-1?n:-1},findNearestSelectedOptionIndex:function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1],n=-1;return this.$filled&&(t?(n=this.findPrevSelectedOptionIndex(e),n=n===-1?this.findNextSelectedOptionIndex(e):n):(n=this.findNextSelectedOptionIndex(e),n=n===-1?this.findPrevSelectedOptionIndex(e):n)),n>-1?n:e}},computed:{visibleOptions:function(){return this.optionGroupLabel?this.flatOptions(this.suggestions):this.suggestions||[]},inputValue:function(){return this.$filled?X(this.d_value)===`object`?this.getOptionLabel(this.d_value)??this.d_value:this.d_value:``},hasSelectedOption:function(){return this.$filled},equalityKey:function(){return this.dataKey},searchResultMessageText:function(){return M(this.visibleOptions)&&this.overlayVisible?this.searchMessageText.replaceAll(`{0}`,this.visibleOptions.length):this.emptySearchMessageText},searchMessageText:function(){return this.searchMessage||this.$primevue.config.locale.searchMessage||``},emptySearchMessageText:function(){return this.emptySearchMessage||this.$primevue.config.locale.emptySearchMessage||``},selectionMessageText:function(){return this.selectionMessage||this.$primevue.config.locale.selectionMessage||``},emptySelectionMessageText:function(){return this.emptySelectionMessage||this.$primevue.config.locale.emptySelectionMessage||``},selectedMessageText:function(){return this.$filled?this.selectionMessageText.replaceAll(`{0}`,this.multiple?this.d_value.length:`1`):this.emptySelectionMessageText},listAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.listLabel:void 0},focusedOptionId:function(){return this.focusedOptionIndex===-1?null:`${this.$id}_${this.focusedOptionIndex}`},focusedMultipleOptionId:function(){return this.focusedMultipleOptionIndex===-1?null:`${this.$id}_multiple_option_${this.focusedMultipleOptionIndex}`},isClearIconVisible:function(){return this.showClear&&this.$filled&&!this.disabled&&!this.loading},ariaSetSize:function(){var e=this;return this.visibleOptions.filter(function(t){return!e.isOptionGroup(t)}).length},virtualScrollerDisabled:function(){return!this.virtualScrollerOptions},panelId:function(){return this.$id+`_panel`},containerDataP:function(){return D({fluid:this.$fluid})},overlayDataP:function(){return D(Y({},`portal-`+this.appendTo,`portal-`+this.appendTo))},inputMultipleDataP:function(){return D(Y({invalid:this.$invalid,disabled:this.disabled,focus:this.focused,fluid:this.$fluid,filled:this.$variant===`filled`,empty:!this.$filled},this.size,this.size))}},components:{InputText:H,VirtualScroller:K,Portal:G,Chip:Pe,ChevronDownIcon:ge,SpinnerIcon:I,TimesIcon:U},directives:{ripple:F}};function $(e){"@babel/helpers - typeof";return $=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},$(e)}function We(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function Ge(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]==null?{}:arguments[t];t%2?We(Object(n),!0).forEach(function(t){Ke(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):We(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function Ke(e,t,n){return(t=qe(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function qe(e){var t=Je(e,`string`);return $(t)==`symbol`?t:t+``}function Je(e,t){if($(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if($(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var Ye=[`data-p`],Xe=[`aria-activedescendant`,`data-p-has-dropdown`,`data-p`],Ze=[`id`,`aria-label`,`aria-setsize`,`aria-posinset`],Qe=[`id`,`placeholder`,`tabindex`,`disabled`,`aria-label`,`aria-labelledby`,`aria-expanded`,`aria-controls`,`aria-activedescendant`,`aria-invalid`],$e=[`data-p-has-dropdown`],et=[`disabled`,`aria-expanded`,`aria-controls`],tt=[`id`,`data-p`],nt=[`id`,`aria-label`],rt=[`id`],it=[`id`,`aria-label`,`aria-selected`,`aria-disabled`,`aria-setsize`,`aria-posinset`,`onClick`,`onMousemove`,`data-p-selected`,`data-p-focused`,`data-p-disabled`];function at(e,n,i,p,h,_){var ee=u(`InputText`),te=u(`TimesIcon`),ne=u(`Chip`),E=u(`SpinnerIcon`),D=u(`VirtualScroller`),O=u(`Portal`),k=r(`ripple`);return t(),w(`div`,T({ref:`container`,class:e.cx(`root`),style:e.sx(`root`),onClick:n[11]||=function(){return _.onContainerClick&&_.onContainerClick.apply(_,arguments)},"data-p":_.containerDataP},e.ptmi(`root`)),[e.multiple?b(``,!0):(t(),f(ee,{key:0,ref:`focusInput`,id:e.inputId,type:`text`,name:e.$formName,class:y([e.cx(`pcInputText`),e.inputClass]),style:v(e.inputStyle),defaultValue:_.inputValue,placeholder:e.placeholder,tabindex:e.disabled?-1:e.tabindex,fluid:e.$fluid,disabled:e.disabled,size:e.size,invalid:e.invalid,variant:e.variant,autocomplete:`off`,role:`combobox`,"aria-label":e.ariaLabel,"aria-labelledby":e.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":h.overlayVisible,"aria-controls":h.overlayVisible?_.panelId:void 0,"aria-activedescendant":h.focused?_.focusedOptionId:void 0,onFocus:_.onFocus,onBlur:_.onBlur,onKeydown:_.onKeyDown,onInput:_.onInput,onChange:_.onChange,unstyled:e.unstyled,"data-p-has-dropdown":e.dropdown,pt:e.ptm(`pcInputText`)},null,8,[`id`,`name`,`class`,`style`,`defaultValue`,`placeholder`,`tabindex`,`fluid`,`disabled`,`size`,`invalid`,`variant`,`aria-label`,`aria-labelledby`,`aria-expanded`,`aria-controls`,`aria-activedescendant`,`onFocus`,`onBlur`,`onKeydown`,`onInput`,`onChange`,`unstyled`,`data-p-has-dropdown`,`pt`])),_.isClearIconVisible?l(e.$slots,`clearicon`,{key:1,class:y(e.cx(`clearIcon`)),clearCallback:_.onClearClick},function(){return[g(te,T({class:[e.cx(`clearIcon`)],onClick:_.onClearClick},e.ptm(`clearIcon`)),null,16,[`class`,`onClick`])]}):b(``,!0),e.multiple?(t(),w(`ul`,T({key:2,ref:`multiContainer`,class:e.cx(`inputMultiple`),tabindex:`-1`,role:`listbox`,"aria-orientation":`horizontal`,"aria-activedescendant":h.focused?_.focusedMultipleOptionId:void 0,onFocus:n[5]||=function(){return _.onMultipleContainerFocus&&_.onMultipleContainerFocus.apply(_,arguments)},onBlur:n[6]||=function(){return _.onMultipleContainerBlur&&_.onMultipleContainerBlur.apply(_,arguments)},onKeydown:n[7]||=function(){return _.onMultipleContainerKeyDown&&_.onMultipleContainerKeyDown.apply(_,arguments)},"data-p-has-dropdown":e.dropdown,"data-p":_.inputMultipleDataP},e.ptm(`inputMultiple`)),[(t(!0),w(S,null,s(e.d_value,function(n,r){return t(),w(`li`,T({key:`${r}_${_.getOptionLabel(n)}`,id:e.$id+`_multiple_option_`+r,class:e.cx(`chipItem`,{i:r}),role:`option`,"aria-label":_.getOptionLabel(n),"aria-selected":!0,"aria-setsize":e.d_value.length,"aria-posinset":r+1},{ref_for:!0},e.ptm(`chipItem`)),[l(e.$slots,`chip`,T({class:e.cx(`pcChip`),value:n,index:r,removeCallback:function(e){return _.removeOption(e,r)}},{ref_for:!0},e.ptm(`pcChip`)),function(){return[g(ne,{class:y(e.cx(`pcChip`)),label:_.getOptionLabel(n),removeIcon:e.chipIcon||e.removeTokenIcon,removable:``,unstyled:e.unstyled,onRemove:function(e){return _.removeOption(e,r)},"data-p-focused":h.focusedMultipleOptionIndex===r,pt:e.ptm(`pcChip`)},{removeicon:o(function(){return[l(e.$slots,e.$slots.chipicon?`chipicon`:`removetokenicon`,{class:y(e.cx(`chipIcon`)),index:r,removeCallback:function(e){return _.removeOption(e,r)}})]}),_:2},1032,[`class`,`label`,`removeIcon`,`unstyled`,`onRemove`,`data-p-focused`,`pt`])]})],16,Ze)}),128)),C(`li`,T({class:e.cx(`inputChip`),role:`option`},e.ptm(`inputChip`)),[C(`input`,T({ref:`focusInput`,id:e.inputId,type:`text`,style:e.inputStyle,class:e.inputClass,placeholder:e.placeholder,tabindex:e.disabled?-1:e.tabindex,disabled:e.disabled,autocomplete:`off`,role:`combobox`,"aria-label":e.ariaLabel,"aria-labelledby":e.ariaLabelledby,"aria-haspopup":`listbox`,"aria-autocomplete":`list`,"aria-expanded":h.overlayVisible,"aria-controls":e.$id+`_list`,"aria-activedescendant":h.focused?_.focusedOptionId:void 0,"aria-invalid":e.invalid||void 0,onFocus:n[0]||=function(){return _.onFocus&&_.onFocus.apply(_,arguments)},onBlur:n[1]||=function(){return _.onBlur&&_.onBlur.apply(_,arguments)},onKeydown:n[2]||=function(){return _.onKeyDown&&_.onKeyDown.apply(_,arguments)},onInput:n[3]||=function(){return _.onInput&&_.onInput.apply(_,arguments)},onChange:n[4]||=function(){return _.onChange&&_.onChange.apply(_,arguments)}},e.ptm(`input`)),null,16,Qe)],16)],16,Xe)):b(``,!0),h.searching||e.loading?l(e.$slots,e.$slots.loader?`loader`:`loadingicon`,{key:3,class:y(e.cx(`loader`))},function(){return[e.loader||e.loadingIcon?(t(),w(`i`,T({key:0,class:[`pi-spin`,e.cx(`loader`),e.loader,e.loadingIcon],"aria-hidden":`true`,"data-p-has-dropdown":e.dropdown},e.ptm(`loader`)),null,16,$e)):e.loading?(t(),f(E,T({key:1,class:e.cx(`loader`),spin:``,"aria-hidden":`true`,"data-p-has-dropdown":e.dropdown},e.ptm(`loader`)),null,16,[`class`,`data-p-has-dropdown`])):b(``,!0)]}):b(``,!0),l(e.$slots,e.$slots.dropdown?`dropdown`:`dropdownbutton`,{toggleCallback:function(e){return _.onDropdownClick(e)}},function(){return[e.dropdown?(t(),w(`button`,T({key:0,ref:`dropdownButton`,type:`button`,class:[e.cx(`dropdown`),e.dropdownClass],disabled:e.disabled,"aria-haspopup":`listbox`,"aria-expanded":h.overlayVisible,"aria-controls":_.panelId,onClick:n[8]||=function(){return _.onDropdownClick&&_.onDropdownClick.apply(_,arguments)}},e.ptm(`dropdown`)),[l(e.$slots,`dropdownicon`,{class:y(e.dropdownIcon)},function(){return[(t(),f(a(e.dropdownIcon?`span`:`ChevronDownIcon`),T({class:e.dropdownIcon},e.ptm(`dropdownIcon`)),null,16,[`class`]))]})],16,et)):b(``,!0)]}),e.typeahead?(t(),w(`span`,T({key:4,role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},e.ptm(`hiddenSearchResult`),{"data-p-hidden-accessible":!0}),c(_.searchResultMessageText),17)):b(``,!0),g(O,{appendTo:e.appendTo},{default:o(function(){return[g(B,T({name:`p-anchored-overlay`,onEnter:_.onOverlayEnter,onAfterEnter:_.onOverlayAfterEnter,onLeave:_.onOverlayLeave,onAfterLeave:_.onOverlayAfterLeave},e.ptm(`transition`)),{default:o(function(){return[h.overlayVisible?(t(),w(`div`,T({key:0,ref:_.overlayRef,id:_.panelId,class:[e.cx(`overlay`),e.panelClass,e.overlayClass],style:Ge(Ge({},e.panelStyle),e.overlayStyle),onClick:n[9]||=function(){return _.onOverlayClick&&_.onOverlayClick.apply(_,arguments)},onKeydown:n[10]||=function(){return _.onOverlayKeyDown&&_.onOverlayKeyDown.apply(_,arguments)},"data-p":_.overlayDataP},e.ptm(`overlay`)),[l(e.$slots,`header`,{value:e.d_value,suggestions:_.visibleOptions}),C(`div`,T({class:e.cx(`listContainer`),style:{"max-height":_.virtualScrollerDisabled?e.scrollHeight:``}},e.ptm(`listContainer`)),[g(D,T({ref:_.virtualScrollerRef},e.virtualScrollerOptions,{style:{height:e.scrollHeight},items:_.visibleOptions,tabindex:-1,disabled:_.virtualScrollerDisabled,pt:e.ptm(`virtualScroller`)}),m({content:o(function(n){var r=n.styleClass,i=n.contentRef,a=n.items,o=n.getItemOptions,u=n.contentStyle,f=n.itemSize;return[C(`ul`,T({ref:function(e){return _.listRef(e,i)},id:e.$id+`_list`,class:[e.cx(`list`),r],style:u,role:`listbox`,"aria-label":_.listAriaLabel},e.ptm(`list`)),[(t(!0),w(S,null,s(a,function(n,r){return t(),w(S,{key:_.getOptionRenderKey(n,_.getOptionIndex(r,o))},[_.isOptionGroup(n)?(t(),w(`li`,T({key:0,id:e.$id+`_`+_.getOptionIndex(r,o),style:{height:f?f+`px`:void 0},class:e.cx(`optionGroup`),role:`option`},{ref_for:!0},e.ptm(`optionGroup`)),[l(e.$slots,`optiongroup`,{option:n.optionGroup,index:_.getOptionIndex(r,o)},function(){return[x(c(_.getOptionGroupLabel(n.optionGroup)),1)]})],16,rt)):d((t(),w(`li`,T({key:1,id:e.$id+`_`+_.getOptionIndex(r,o),style:{height:f?f+`px`:void 0},class:e.cx(`option`,{option:n,i:r,getItemOptions:o}),role:`option`,"aria-label":_.getOptionLabel(n),"aria-selected":_.isSelected(n),"aria-disabled":_.isOptionDisabled(n),"aria-setsize":_.ariaSetSize,"aria-posinset":_.getAriaPosInset(_.getOptionIndex(r,o)),onClick:function(e){return _.onOptionSelect(e,n)},onMousemove:function(e){return _.onOptionMouseMove(e,_.getOptionIndex(r,o))},"data-p-selected":_.isSelected(n),"data-p-focused":h.focusedOptionIndex===_.getOptionIndex(r,o),"data-p-disabled":_.isOptionDisabled(n)},{ref_for:!0},_.getPTOptions(n,o,r,`option`)),[l(e.$slots,`option`,{option:n,index:_.getOptionIndex(r,o)},function(){return[x(c(_.getOptionLabel(n)),1)]})],16,it)),[[k]])],64)}),128)),e.showEmptyMessage&&(!a||a&&a.length===0)?(t(),w(`li`,T({key:0,class:e.cx(`emptyMessage`),role:`option`},e.ptm(`emptyMessage`)),[l(e.$slots,`empty`,{},function(){return[x(c(_.searchResultMessageText),1)]})],16)):b(``,!0)],16,nt)]}),_:2},[e.$slots.loader?{name:`loader`,fn:o(function(t){var n=t.options;return[l(e.$slots,`loader`,{options:n})]}),key:`0`}:void 0]),1040,[`style`,`items`,`disabled`,`pt`])],16),l(e.$slots,`footer`,{value:e.d_value,suggestions:_.visibleOptions}),C(`span`,T({role:`status`,"aria-live":`polite`,class:`p-hidden-accessible`},e.ptm(`hiddenSelectedMessage`),{"data-p-hidden-accessible":!0}),c(_.selectedMessageText),17)],16,tt)):b(``,!0)]}),_:3},16,[`onEnter`,`onAfterEnter`,`onLeave`,`onAfterLeave`])]}),_:3},8,[`appendTo`])],16,Ye)}Ue.render=at;var ot={class:`page`},st={class:`data-panel`},ct=[`href`],lt={key:1},ut={class:`form-grid single`},dt={key:0,class:`field`},ft={class:`field`},pt={class:`field`},mt={class:`field`},ht={class:`field`},gt={class:`field`},_t={key:0},vt={class:`field`},yt={class:`field`},bt={class:`dialog-actions`},xt=pe(h({__name:`ExpensesView`,setup(r){let a=ue(),s=be(),{ask:l}=xe(),u=_([]),d=_([]),m=_([]),h=_(a.scopedComplexId),v=_(null),{items:y,loading:T,page:ne,pageSize:E,total:D,search:O,load:k,onSearch:A,setFilter:j,setSortMode:re,onTableSort:ie,sortField:ae,sortOrder:oe,sortMode:M,onLazyPage:N}=Ce(ke),P=_(!1),F=_(!1),I=_(null),R=_(new Date),z=_(null),B=_(null),V=_(null),U=ee({complexId:``,categoryName:``,categoryId:null,amount:0,payee:``,documentNumber:``,notes:``}),G=te(()=>ce(u.value,e=>e.nameAr||e.name||e.id)),pe=te(()=>d.value.map(e=>({label:e.name,value:e.id})));async function me(){let e=await ye({Page:1,PageSize:200});u.value=e.items??[]}async function K(e){if(!e){d.value=[];return}d.value=await Me({complexId:e})}async function ge(e){let t=U.complexId||h.value;if(!t){m.value=[];return}m.value=await Me({complexId:t,search:e.query||void 0})}function Pe(){I.value=null,V.value=null,B.value&&(B.value.value=``),R.value=new Date,z.value=null,Object.assign(U,{complexId:h.value||a.scopedComplexId||u.value[0]?.id||``,categoryName:``,categoryId:null,amount:0,payee:``,documentNumber:``,notes:``}),K(U.complexId),P.value=!0}function Fe(e){I.value=e.id,V.value=null,B.value&&(B.value.value=``),R.value=e.expenseDate?new Date(e.expenseDate):new Date,z.value={id:e.categoryId,name:e.categoryName,complexId:e.complexId},Object.assign(U,{complexId:e.complexId,categoryName:e.categoryName,categoryId:e.categoryId,amount:Number(e.amount),payee:e.payee,documentNumber:e.documentNumber||``,notes:e.notes||``}),K(e.complexId),P.value=!0}function Ie(e){let t=e.target;V.value=t.files?.[0]??null}function Y(){return typeof z.value==`string`?{categoryName:z.value.trim(),categoryId:null}:z.value&&typeof z.value==`object`?{categoryName:z.value.name,categoryId:z.value.id}:{categoryName:U.categoryName.trim(),categoryId:U.categoryId}}async function Le(){let{categoryName:e,categoryId:t}=Y();if(!U.complexId){s.warning(`اختر المجمع`);return}if(!e){s.warning(`أدخل اسم المصروف`);return}if(!U.amount||U.amount<=0){s.warning(`أدخل مبلغاً صالحاً`);return}if(!U.payee.trim()){s.warning(`أدخل جهة الصرف`);return}let n={categoryName:e,categoryId:t,amount:Number(U.amount),payee:U.payee.trim(),documentNumber:U.documentNumber.trim()||null,expenseDate:R.value?R.value.toISOString():null,notes:U.notes.trim()||null,complexId:U.complexId,file:V.value};F.value=!0;try{I.value?(await je(I.value,n),s.success(`تم تحديث المصروف`)):(await Ne(n),s.success(`تم إضافة المصروف`)),P.value=!1,await K(U.complexId),await k()}catch(e){s.error(W(e))}finally{F.value=!1}}async function Re(e){if(await l(`هل تريد حذف هذا المصروف؟`,`حذف مصروف`))try{await Ae(e.id),s.success(`تم الحذف`),await k()}catch(e){s.error(W(e))}}return i(h,async e=>{j(`ComplexId`,e||void 0),v.value=null,j(`CategoryId`,void 0),await K(e),await k()}),i(v,e=>{j(`CategoryId`,e||void 0),k()}),i(()=>U.complexId,e=>{K(e)}),n(async()=>{try{await me(),h.value||=a.scopedComplexId||u.value[0]?.id||null,h.value&&j(`ComplexId`,h.value),await K(h.value),await k()}catch(e){s.error(W(e))}}),(n,r)=>(t(),w(`div`,ot,[g(we,{title:`إضافة المصاريف`,subtitle:`تسجيل المصاريف مع الفئات الذكية والمرفقات`},{actions:o(()=>[g(p(L),{label:`إضافة مصروف`,icon:`pi pi-plus`,onClick:Pe})]),_:1}),C(`div`,st,[g(Se,{search:p(O),"onUpdate:search":r[2]||=t=>e(O)?O.value=t:null,placeholder:`بحث بالجهة أو رقم المستند أو الاسم...`,onSearch:p(A),"sort-mode":p(M),"onUpdate:sortMode":r[3]||=t=>e(M)?M.value=t:null,onSortChange:p(re)},{default:o(()=>[p(a).canSelectComplex?(t(),f(p(q),{key:0,modelValue:h.value,"onUpdate:modelValue":r[0]||=e=>h.value=e,options:G.value,"option-label":`label`,"option-value":`id`,placeholder:`المجمع`,"show-clear":``,"append-to":`body`},null,8,[`modelValue`,`options`])):b(``,!0),g(p(q),{modelValue:v.value,"onUpdate:modelValue":r[1]||=e=>v.value=e,options:pe.value,"option-label":`label`,"option-value":`value`,placeholder:`اسم المصروف`,"show-clear":``,filter:``,"append-to":`body`},null,8,[`modelValue`,`options`])]),_:1},8,[`search`,`onSearch`,`sort-mode`,`onSortChange`]),p(T)&&!p(y).length?(t(),f(Ee,{key:0})):(t(),w(S,{key:1},[g(Te,{"sort-mode":p(M)},null,8,[`sort-mode`]),g(p(ve),{value:p(y),lazy:!0,paginator:!0,rows:p(E),"total-records":p(D),first:(p(ne)-1)*p(E),"data-key":`id`,"striped-rows":``,onPage:p(N),"sort-mode":`single`,"sort-field":p(ae),"sort-order":p(oe),"removable-sort":``,onSort:p(ie)},{empty:o(()=>[...r[13]||=[C(`div`,{class:`empty-box`},`لا توجد مصاريف`,-1)]]),default:o(()=>[g(p(J),{header:`رقم المستند`,style:{width:`120px`},sortable:``},{body:o(({data:e})=>[x(c(e.documentNumber||`—`),1)]),_:1}),g(p(J),{header:`اسم المصروف`,sortable:``},{body:o(({data:e})=>[x(c(e.categoryName),1)]),_:1}),g(p(J),{header:`المبلغ`,style:{width:`120px`},sortable:``},{body:o(({data:e})=>[x(c(p(de)(e.amount)),1)]),_:1}),g(p(J),{header:`جهة الصرف`,sortable:``},{body:o(({data:e})=>[x(c(e.payee),1)]),_:1}),g(p(J),{header:`تاريخ الصرف`,style:{width:`120px`},sortable:``},{body:o(({data:e})=>[x(c(p(se)(e.expenseDate)),1)]),_:1}),g(p(J),{header:`المرفق`,style:{width:`110px`},sortable:``},{body:o(({data:e})=>[e.attachmentPath?(t(),w(`a`,{key:0,href:p(Oe)(e.attachmentPath),target:`_blank`,rel:`noopener`,class:`link`},`معاينة`,8,ct)):(t(),w(`span`,lt,`—`))]),_:1}),g(p(J),{header:`ملاحظات`,sortable:``},{body:o(({data:e})=>[x(c(e.notes||`—`),1)]),_:1}),g(p(J),{header:``,style:{width:`100px`}},{body:o(({data:e})=>[g(De,{onEdit:t=>Fe(e),onDelete:t=>Re(e)},null,8,[`onEdit`,`onDelete`])]),_:1})]),_:1},8,[`value`,`rows`,`total-records`,`first`,`onPage`,`sort-field`,`sort-order`,`onSort`])],64))]),g(p(le),{visible:P.value,"onUpdate:visible":r[12]||=e=>P.value=e,modal:``,header:I.value?`تعديل مصروف`:`إضافة مصروف`,style:{width:`560px`}},{footer:o(()=>[C(`div`,bt,[g(p(L),{label:`إلغاء`,severity:`secondary`,outlined:``,onClick:r[11]||=e=>P.value=!1}),g(p(L),{label:`حفظ`,loading:F.value,onClick:Le},null,8,[`loading`])])]),default:o(()=>[C(`div`,ut,[p(a).canSelectComplex?(t(),w(`div`,dt,[r[14]||=C(`label`,null,`المجمع`,-1),g(p(q),{modelValue:U.complexId,"onUpdate:modelValue":r[4]||=e=>U.complexId=e,options:G.value,"option-label":`label`,"option-value":`id`,"append-to":`body`},null,8,[`modelValue`,`options`])])):b(``,!0),C(`div`,ft,[r[15]||=C(`label`,null,`اسم المصروف`,-1),g(p(Ue),{modelValue:z.value,"onUpdate:modelValue":r[5]||=e=>z.value=e,suggestions:m.value,"option-label":`name`,dropdown:``,"force-selection":!1,placeholder:`اكتب أو اختر من القائمة`,class:`w-full`,onComplete:ge},{option:o(({option:e})=>[x(c(e.name),1)]),_:1},8,[`modelValue`,`suggestions`]),r[16]||=C(`small`,{class:`field-hint`},`إن كان الاسم جديداً يُحفظ تلقائياً للقوائم القادمة`,-1)]),C(`div`,pt,[r[17]||=C(`label`,null,`المبلغ`,-1),g(p(fe),{modelValue:U.amount,"onUpdate:modelValue":r[6]||=e=>U.amount=e,min:0,"min-fraction-digits":0,"max-fraction-digits":2},null,8,[`modelValue`])]),C(`div`,mt,[r[18]||=C(`label`,null,`جهة الصرف`,-1),g(p(H),{modelValue:U.payee,"onUpdate:modelValue":r[7]||=e=>U.payee=e,placeholder:`المورد / المقاول / الشركة`},null,8,[`modelValue`])]),C(`div`,ht,[r[19]||=C(`label`,null,`رقم المستند / الفاتورة`,-1),g(p(H),{modelValue:U.documentNumber,"onUpdate:modelValue":r[8]||=e=>U.documentNumber=e},null,8,[`modelValue`])]),C(`div`,gt,[r[20]||=C(`label`,null,`رفع صورة الفاتورة / المستند`,-1),C(`input`,{ref_key:`fileInput`,ref:B,type:`file`,accept:`.pdf,.png,.jpg,.jpeg,.webp`,class:`file-input`,onChange:Ie},null,544),V.value?(t(),w(`small`,_t,c(V.value.name),1)):b(``,!0)]),C(`div`,vt,[r[21]||=C(`label`,null,`تاريخ الصرف`,-1),g(p(_e),{modelValue:R.value,"onUpdate:modelValue":r[9]||=e=>R.value=e,"date-format":`yy-mm-dd`,"show-icon":``,"append-to":`body`,class:`w-full`},null,8,[`modelValue`])]),C(`div`,yt,[r[22]||=C(`label`,null,`ملاحظات`,-1),g(p(he),{modelValue:U.notes,"onUpdate:modelValue":r[10]||=e=>U.notes=e,rows:`3`,"auto-resize":``},null,8,[`modelValue`])])])]),_:1},8,[`visible`,`header`])]))}}),[[`__scopeId`,`data-v-acdfd9e4`]]);export{xt as default};
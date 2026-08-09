import{At as e,En as t,F as n,N as r,Sn as i,cn as a,gr as o,hn as s,kn as c,ln as l,on as u}from"./client-DKXER64_.js";var d={class:`page-header`},f={class:`page-header__text`},p={key:0,class:`page-header__eyebrow`},m={class:`page-header__title`},h={key:1,class:`page-header__subtitle`},g={key:0,class:`page-header__actions`},_=s({__name:`PageHeader`,props:{title:{},subtitle:{}},setup(e){return(n,r)=>(t(),l(`header`,d,[u(`div`,f,[e.subtitle?(t(),l(`p`,p,`لوحة الإدارة`)):a(``,!0),u(`h2`,m,o(e.title),1),e.subtitle?(t(),l(`p`,h,o(e.subtitle),1)):a(``,!0)]),n.$slots.actions?(t(),l(`div`,g,[c(n.$slots,`actions`)])):a(``,!0)]))}}),v=n.extend({name:`skeleton`,style:`
    .p-skeleton {
        display: block;
        overflow: hidden;
        background: dt('skeleton.background');
        border-radius: dt('skeleton.border.radius');
    }

    .p-skeleton::after {
        content: '';
        animation: p-skeleton-animation 1.2s infinite;
        height: 100%;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(-100%);
        z-index: 1;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0), dt('skeleton.animation.background'), rgba(255, 255, 255, 0));
    }

    [dir='rtl'] .p-skeleton::after {
        animation-name: p-skeleton-animation-rtl;
    }

    .p-skeleton-circle {
        border-radius: 50%;
    }

    .p-skeleton-animation-none::after {
        animation: none;
    }

    @keyframes p-skeleton-animation {
        from {
            transform: translateX(-100%);
        }
        to {
            transform: translateX(100%);
        }
    }

    @keyframes p-skeleton-animation-rtl {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(-100%);
        }
    }
`,classes:{root:function(e){var t=e.props;return[`p-skeleton p-component`,{"p-skeleton-circle":t.shape===`circle`,"p-skeleton-animation-none":t.animation===`none`}]}},inlineStyles:{root:{position:`relative`}}}),y={name:`BaseSkeleton`,extends:r,props:{shape:{type:String,default:`rectangle`},size:{type:String,default:null},width:{type:String,default:`100%`},height:{type:String,default:`1rem`},borderRadius:{type:String,default:null},animation:{type:String,default:`wave`}},style:v,provide:function(){return{$pcSkeleton:this,$parentInstance:this}}};function b(e){"@babel/helpers - typeof";return b=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},b(e)}function x(e,t,n){return(t=S(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function S(e){var t=C(e,`string`);return b(t)==`symbol`?t:t+``}function C(e,t){if(b(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(b(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}var w={name:`Skeleton`,extends:y,inheritAttrs:!1,computed:{containerStyle:function(){return this.size?{width:this.size,height:this.size,borderRadius:this.borderRadius}:{width:this.width,height:this.height,borderRadius:this.borderRadius}},dataP:function(){return e(x({},this.shape,this.shape))}}},T=[`data-p`];function E(e,n,r,a,o,s){return t(),l(`div`,i({class:e.cx(`root`),style:[e.sx(`root`),s.containerStyle],"aria-hidden":`true`},e.ptmi(`root`),{"data-p":s.dataP}),null,16,T)}w.render=E;export{_ as n,w as t};
define(["require", "exports", "observable"], function (require, exports, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    'use strict';
    function virtualNode(tag, attrs) {
        var children = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            children[_i - 2] = arguments[_i];
        }
        var vnode = {};
        vnode.tag = tag, vnode.attrs = attrs;
        var childNodes = Array.prototype.slice.call(arguments, 2);
        if (childNodes.length)
            vnode.children = childNodes;
        return vnode;
    }
    exports.virtualNode = virtualNode;
    window.virtualNode = virtualNode;
    var Template = /** @class */ (function () {
        function Template(fn) {
            this.raw = fn;
            this.statesSchema = new observable_1.Schema('$__mvc.states__');
            var modelBuilder = this.statesSchema.$createBuilder();
            this.vnode = fn(modelBuilder);
            Object.defineProperty(fn, '$__Template.instance__', { enumerable: false, writable: false, configurable: false, value: this });
        }
        Template.resolve = function (fn) {
            var tmpl = fn['$__Template.instance__'];
            if (!tmpl)
                tmpl = new Template(fn);
            return tmpl;
        };
        Template.prototype.render = function (states, store, controller) {
            var scope = new observable_1.Scope(undefined);
            var statesObservable = new observable_1.Observable(this.statesSchema, states, '$__mvc.states__');
            scope['$__mvc.states__'] = statesObservable;
            var context = { template: this, states: states, store: store, controller: controller, scope: scope };
            return renderVirtualNode(this.vnode, context);
        };
        return Template;
    }());
    exports.Template = Template;
    function renderVirtualNode(vnode, context) {
        var elem = renderDomElement(vnode, context);
        return elem;
    }
    function renderDomElement(vnode, context) {
        var elem = DomApi.createElement(vnode.tag);
        for (var attrName in vnode.attrs) {
            var attrValue = vnode.attrs[attrName];
            if (DomApi.isEventAttr(elem, attrName) && typeof attrValue === 'function') {
                bindDomElementEvent(elem, attrName, attrValue, context);
                continue;
            }
            bindDomElementAttr(elem, attrName, vnode.attrs[attrName], context);
        }
        return elem;
    }
    function bindDomElementEvent(elem, evtName, handler, context) {
        DomApi.attachEvent(elem, evtName, function (e) {
            handler.call(context.controller, context.states, elem);
            context.scope['$__mvc.states__'].$set(context.states).$update();
        });
    }
    function bindDomElementAttr(elem, attrName, attrValue, context) {
        //从proxy里面放出来
        if (attrValue)
            attrValue = attrValue['$__builder.target__'] || attrValue;
        if (attrValue instanceof observable_1.Schema) {
            attrValue = attrValue.$resolveFromScope(context.scope);
        }
        if (attrValue instanceof observable_1.Observable) {
            DomApi.setAttribute(elem, attrName, attrValue.$get());
            var attrBinder = DomAttrBinders[attrName];
            if (attrBinder)
                attrBinder(elem, attrValue);
            else {
                attrValue.$subscribe(function (evt) { return elem[attrName] = evt.value; });
            }
        }
        else {
            DomApi.setAttribute(elem, attrName, attrValue);
        }
    }
    var evtNameRegx = /^on/g;
    var DomApi = {
        createElement: function (tag) { return document.createElement(tag); },
        isEventAttr: function (elem, name) { return evtNameRegx.test(name) && elem[name] === null; },
        attachEvent: function (elem, evt, handler) { return elem.addEventListener(evt.replace(evtNameRegx, ''), handler, false); },
        setAttribute: function (elem, name, value) { return elem[name] = value; }
    };
    var DomAttrBinders = {
        'value': DomValueBinder
    };
    function DomValueBinder(elem, value) {
        if (elem.tagName === 'INPUT') {
            elem.value = value.$get();
            value.$subscribe(function (e) {
                elem.value = e.value;
            });
        }
    }
});
//# sourceMappingURL=mvc.js.map
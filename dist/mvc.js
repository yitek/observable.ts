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
        var elem = handleCondition(vnode, context);
        if (elem !== undefined)
            return elem;
        elem = renderDomText(vnode, context);
        if (elem !== undefined)
            return elem;
        elem = renderDomElement(vnode, context);
        return elem;
    }
    function handleCondition(vnode, context) {
        if (!vnode || !vnode.attrs || !vnode.attrs.if)
            return;
        var value = vnode.attrs.if;
        if (value instanceof observable_1.Schema) {
            value = value['$__builder.target__'] || value;
            value = value.$resolveFromScope(context.scope);
        }
        if (value instanceof observable_1.Observable) {
            vnode.attrs.if = null;
            var elem_1 = renderVirtualNode(vnode, context);
            vnode.attrs.if = value;
            var anchor_1 = DomApi.createComment('if');
            value.$subscribe(function (e) {
                if (e.value) {
                    if (anchor_1.parentNode) {
                        DomApi.insertBefore(elem_1, anchor_1);
                        DomApi.remove(anchor_1);
                    }
                }
                else {
                    if (elem_1.parentNode) {
                        DomApi.insertBefore(anchor_1, elem_1);
                        DomApi.remove(elem_1);
                    }
                }
            });
            var condition = value.$get();
            if (!condition) {
                return anchor_1;
            }
            else {
                return elem_1;
            }
        }
        if (value) {
            vnode.attrs.if = null;
            var elem = renderVirtualNode(vnode, context);
            vnode.attrs.if = value;
            return elem;
        }
        else
            return null;
    }
    function renderDomText(value, context) {
        var t = typeof value;
        if (t === 'string')
            return DomApi.createText(value.toString());
        if (value instanceof observable_1.Schema) {
            value = value['$__builder.target__'] || value;
            value = value.$resolveFromScope(context.scope);
        }
        if (value instanceof observable_1.Observable) {
            var elem_2 = DomApi.createText(value.$get());
            value.$subscribe(function (e) {
                elem_2.nodeValue = e.value;
            });
            return elem_2;
        }
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
        if (vnode.children) {
            for (var _i = 0, _a = vnode.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var childNode = renderVirtualNode(child, context);
                if (childNode)
                    elem.appendChild(childNode);
            }
        }
        return elem;
    }
    function bindDomElementEvent(elem, evtName, handler, context) {
        DomApi.attachEvent(elem, evtName, function (e) {
            handler.call(context.controller, context.states, elem);
            context.scope['$__mvc.states__'].$set(context.states).$update();
        });
    }
    function bindDomElementAttr(elem, name, value, context) {
        //从proxy里面放出来
        if (value instanceof observable_1.Schema) {
            value = value['$__builder.target__'] || value;
            value = value.$resolveFromScope(context.scope);
        }
        if (value instanceof observable_1.Observable) {
            DomApi.setAttribute(elem, name, value.$get());
            var attrBinder = DomAttrBinders[name];
            if (attrBinder)
                attrBinder(elem, value);
            else {
                value.$subscribe(function (evt) { return elem[name] = evt.value; });
            }
        }
        else {
            DomApi.setAttribute(elem, name, value);
        }
    }
    var evtNameRegx = /^on/g;
    var DomApi = {
        createElement: function (tag) { return document.createElement(tag); },
        createText: function (content) { return document.createTextNode(content); },
        createComment: function (content) { return document.createComment(content || ''); },
        isEventAttr: function (elem, name) { return evtNameRegx.test(name) && elem[name] === null; },
        attachEvent: function (elem, evt, handler) { return elem.addEventListener(evt.replace(evtNameRegx, ''), handler, false); },
        setAttribute: function (elem, name, value) { return elem[name] = value; },
        insertBefore: function (inserted, ref) { return ref.parentNode.insertBefore(inserted, ref); },
        remove: function (node) { return (node.parentNode) ? node.parentNode.removeChild(node) : undefined; }
    };
    var DomAttrBinders = {
        'value': DomValueBinder,
        'bind': function (elem, value) { return DomValueBinder(elem, value, true); }
    };
    function DomValueBinder(elem, value, bibind) {
        var valueElem;
        if (elem.tagName === 'INPUT') {
            if (elem.type === 'checkbox') {
                var p = elem.parentNode;
                for (var i = 0, j = p.childNodes; i < j; i++) {
                    var child = p.childNodes[i];
                    if (child.tagName === 'INPUT' && child.type === 'checkbox' && child.name === elem.name) {
                        throw "not implement";
                    }
                }
            }
            valueElem = elem;
        }
        else if (elem.tagName === 'TEXTAREA') {
            valueElem = elem;
        }
        else if (elem.tagName === 'SELECT') {
            valueElem = elem;
        }
        else {
            elem.innerHTML = value.$get();
            value.$subscribe(function (e) {
                elem.innerHTML = e.value;
            });
        }
        if (valueElem) {
            elem.value = value.$get();
            value.$subscribe(function (e) {
                elem.value = e.value;
            });
        }
        if (bibind) {
            DomApi.attachEvent(elem, 'blur', function () {
                value.$set(elem.value);
                value.$update();
            });
            DomApi.attachEvent(elem, 'change', function () {
                value.$set(elem.value);
                value.$update();
            });
        }
    }
    function DomBindBinder(elem, value) {
    }
});
//# sourceMappingURL=mvc.js.map
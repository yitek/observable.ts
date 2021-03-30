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
            currentVLoops = this.vloops = {};
            currentVLoopsCount = 0;
            this.vnode = fn(modelBuilder);
            currentVLoops = undefined;
            currentVLoopsCount = 0;
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
    var currentVLoops;
    var currentVLoopsCount = 0;
    function vloop(name) {
        if (!name)
            name = '-loop-item-' + (currentVLoopsCount++);
        var schema = new observable_1.Schema(name);
        currentVLoops[name] = schema.$createBuilder();
    }
    function renderVirtualNode(vnode, context, returnElem) {
        var elem = renderDomText(vnode, context, returnElem);
        if (elem !== undefined)
            return elem;
        elem = handleCondition(vnode, context, returnElem);
        if (elem !== undefined)
            return elem;
        elem = renderDomElement(vnode, context, returnElem);
        return elem;
    }
    function handleCondition(vnode, context, returnElem) {
        if (!vnode || !vnode.attrs || !vnode.attrs.if)
            return;
        var value = vnode.attrs.if;
        if (value instanceof observable_1.Schema) {
            value = value['$__builder.target__'] || value;
            value = value.$resolveFromScope(context.scope);
        }
        if (value instanceof observable_1.Observable) {
            vnode.attrs.if = undefined;
            var elem_1 = renderVirtualNode(vnode, context, true);
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
                return returnElem ? anchor_1 : function (container) { return DomApi.append(container, anchor_1); };
            }
            else {
                return returnElem ? elem_1 : function (container) { return DomApi.append(container, elem_1); };
            }
        }
        if (value) {
            vnode.attrs.if = undefined;
            var elem_2 = renderVirtualNode(vnode, context, true);
            vnode.attrs.if = value;
            return returnElem ? elem_2 : function (p) { return DomApi.append(p, elem_2); };
        }
        else
            return null;
    }
    function handleFor(vnode, context) {
        if (!vnode || !vnode.attrs || !vnode.attrs.for)
            return;
        var pair = vnode.attrs.for;
        var value = pair.each;
        if (!value)
            return;
        var items = [];
        var scope = context.scope;
        var anchor = DomApi.createComment('for');
        Object.defineProperty(anchor, '$__mvc.for.anchor__', { enumerable: false, configurable: true, writable: true, value: items });
        function loop(each, asSchema, length) {
            for (var i = 0; i < length; i++) {
                var item = each[i];
                if (item instanceof observable_1.Observable) {
                    scope[asSchema.$name] = item;
                }
                else {
                    scope[asSchema.$name] = new observable_1.Observable(asSchema, item);
                }
                vnode.attrs.for = undefined;
                var itemElem = renderVirtualNode(vnode, context);
                vnode.attrs.for = pair;
                items.push(itemElem);
            }
        }
        if (value instanceof observable_1.Schema) {
            value = value['$__builder.target__'] || value;
            value = value.$resolveFromScope(context.scope);
        }
        if (value instanceof observable_1.Observable) {
        }
    }
    function renderDomText(value, context, returnElem) {
        var t = typeof value;
        if (t === 'string')
            return returnElem ? DomApi.createText(value.toString()) : function (p) { return DomApi.append(p, DomApi.createText(value.toString())); };
        if (value instanceof observable_1.Schema) {
            value = value['$__builder.target__'] || value;
            value = value.$resolveFromScope(context.scope);
        }
        if (value instanceof observable_1.Observable) {
            var elem_3 = DomApi.createText(value.$get());
            value.$subscribe(function (e) {
                elem_3.nodeValue = e.value;
            });
            return returnElem ? elem_3 : function (p) { return DomApi.append(p, elem_3); };
        }
    }
    function renderDomElement(vnode, context, returnElem) {
        var elem = DomApi.createElement(vnode.tag);
        for (var attrName in vnode.attrs) {
            var attrValue = vnode.attrs[attrName];
            if (attrValue === undefined)
                continue;
            if (DomApi.isEventAttr(elem, attrName) && typeof attrValue === 'function') {
                bindDomElementEvent(elem, attrName, attrValue, context);
                continue;
            }
            bindDomElementAttr(elem, attrName, vnode.attrs[attrName], context);
        }
        if (vnode.children) {
            for (var _i = 0, _a = vnode.children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (!child)
                    continue;
                var childMount = renderVirtualNode(child, context);
                if (childMount)
                    childMount(elem);
            }
        }
        return returnElem ? elem : function (p) { return DomApi.append(p, elem); };
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
        append: function (p, child) { return p.appendChild(child); },
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
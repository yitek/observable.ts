var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports"], function (require, exports) {
    'use strict;';
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * 是否是数组
     *
     * @export
     * @param {*} o 要判定的值
     * @returns 数组返回true,否则返回false
     */
    function is_array(o) { return Object.prototype.toString.call(o) === '[object Array]'; }
    exports.is_array = is_array;
    /**
     * 数组是否包含某元素
     *
     * @export
     * @param {*} arr array like object/数组
     * @param {*} item 要判定的项值
     * @returns item在数组种返回true, 否则返回false
     */
    function array_contains(arr, item) {
        if (arr)
            for (var i = 0, j = arr.length; i < j; i++) {
                if (arr[i] === item)
                    return true;
            }
        return false;
    }
    exports.array_contains = array_contains;
    /**
     * 从数组中移除某个元素
     *
     * @export
     * @param {*} arr 要移除元素的数组
     * @param {*} item 要移除的元素
     * @returns 被移除的元素个数，0表示没有元素被移除
     */
    function array_remove(arr, item) {
        var c = 0;
        if (arr)
            for (var i = 0, j = arr.length; i < j; i++) {
                var existed = arr.shift();
                if (item !== existed) {
                    arr.push(existed);
                }
                else
                    c++;
            }
        return c;
    }
    exports.array_remove = array_remove;
    var intRegx = /^\s*[0-9]+\s*$/g;
    function is_int(o) {
        if (o === undefined || o === null)
            return false;
        if (o instanceof Number)
            return true;
        return intRegx.test(o.toString());
    }
    exports.is_int = is_int;
    var trimRegx = /^s+|s+$/gi;
    function trim(o) {
        if (o === null || o === undefined)
            return '';
        return o.toString().replace(trimRegx, '');
    }
    exports.trim = trim;
    function implicit(target, names) {
        if (target) {
            if (names) {
                if (is_array(names)) {
                    for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                        var name_1 = names_1[_i];
                        Object.defineProperty(target, name_1, { enumerable: false, configurable: true, writable: true, value: target[name_1] });
                    }
                }
                else {
                    for (var name_2 in names)
                        Object.defineProperty(target, name_2, { enumerable: false, configurable: true, writable: true, value: names[name_2] });
                }
            }
            else
                for (var name_3 in target)
                    Object.defineProperty(target, name_3, { enumerable: false, configurable: true, writable: true, value: target[name_3] });
            return target;
        }
        return function (target, name) {
            if (name) {
                Object.defineProperty(target, name, { enumerable: false, configurable: true, writable: true, value: target[name] });
                return target;
            }
            var raw = target;
            if (typeof target === 'function')
                target = target.prototype;
            for (var name_4 in target)
                Object.defineProperty(target, name_4, { enumerable: false, configurable: true, writable: true, value: target[name_4] });
            return raw;
        };
    }
    exports.implicit = implicit;
    var ObservableTypes;
    (function (ObservableTypes) {
        ObservableTypes[ObservableTypes["value"] = 0] = "value";
        ObservableTypes[ObservableTypes["object"] = 1] = "object";
        ObservableTypes[ObservableTypes["array"] = 2] = "array";
    })(ObservableTypes || (ObservableTypes = {}));
    var Schema = /** @class */ (function () {
        function Schema(name, owner) {
            implicit(this, {
                $type: ObservableTypes.value, $name: name, $owner: owner, $item: undefined
            });
        }
        Schema_1 = Schema;
        Schema.prototype.$define = function (value) {
            var t = typeof value;
            if (t === 'object') {
                if (is_array(value)) {
                    var item = this.$asArray();
                    item.$define(value[0]);
                }
                else {
                    for (var name_5 in value) {
                        this.$prop(name_5).$define(value[name_5]);
                    }
                }
            }
            else {
                this.$type = ObservableTypes.value;
            }
            return this;
        };
        Schema.prototype.$prop = function (name, raw) {
            if (this.$type === ObservableTypes.value)
                this.$type = ObservableTypes.object;
            if (this.$type === ObservableTypes.array)
                throw new Error('不可以给数组增添属性');
            var prop = new Schema_1(name, this);
            //为了使用Proxy,不能writable&configurable 都为false
            Object.defineProperty(this, name, { enumerable: true, configurable: true, writable: false, value: prop });
            return prop;
        };
        Schema.prototype.$asArray = function (item) {
            if (this.$type === ObservableTypes.value)
                this.$type = ObservableTypes.array;
            if (this.$type === ObservableTypes.object)
                throw new Error('不可以将对象转成数组');
            if (!this.$item)
                this.$item = item || new Schema_1('', this);
            return this.$item;
        };
        Schema.prototype.$createBuilder = function () {
            return new Proxy(this, schemaBuilderHandlers);
        };
        Schema.prototype.$resolveFromScope = function (scope) {
            var names = this['$__pathnames'];
            if (!names) {
                names = [];
                var p = this;
                while (p) {
                    var name_6 = p.$name;
                    if (name_6 === undefined || name_6 === null)
                        name_6 = '';
                    names.unshift(name_6);
                    p = p.$owner;
                }
                Object.defineProperty(this, '$__pathnames', { enumerable: false, configurable: false, writable: false, value: names
                });
            }
            var rootName = names[0];
            var ob = scope.$resolve(rootName);
            for (var i = 1; i < names.length; i++) {
                ob = ob[names[i]];
            }
            return ob;
        };
        var Schema_1;
        Schema = Schema_1 = __decorate([
            implicit()
        ], Schema);
        return Schema;
    }());
    exports.Schema = Schema;
    var schemaBuilderHandlers = {
        get: function (target, name) {
            if (name === '$__builder.target__')
                return target;
            var prop;
            if (is_int(name)) {
                console.log(target);
                prop = target.$asArray();
            }
            else {
                prop = target[name];
                if (!prop) {
                    if (target.$type === ObservableTypes.array)
                        prop = target.$asArray();
                    else
                        prop = target.$prop(name);
                }
            }
            if (prop instanceof Schema) {
                return prop.$createBuilder();
            }
            return prop;
        },
        set: function (target, name, value) {
            throw new Error('schema的构造阶段不允许设置值');
        }
    };
    var delayTasks = [];
    var delayTimer;
    function delay(task) {
        if (!delayTimer)
            delayTimer = setTimeout(function () {
                while (delayTasks.length) {
                    var task_1 = delayTasks.shift();
                    task_1();
                }
                delayTimer = 0;
            }, 0);
    }
    exports.delay = delay;
    var ObservableGetterTypes;
    (function (ObservableGetterTypes) {
        ObservableGetterTypes[ObservableGetterTypes["newest"] = 0] = "newest";
        ObservableGetterTypes[ObservableGetterTypes["old"] = 1] = "old";
        ObservableGetterTypes[ObservableGetterTypes["raw"] = 2] = "raw";
    })(ObservableGetterTypes || (ObservableGetterTypes = {}));
    function notify(evt) {
        if (this.$__observers__) {
            for (var i = 0, j = this.$__observers__.length; i < j; i++) {
                if (this.$__observers__[i].call(this, evt) === false)
                    return this;
            }
        }
        return this;
    }
    function subscribe(handler) {
        (this.$__observers__ || (this.$__observers__ = [])).push(handler);
        return this;
    }
    function unsibscribe(handler) {
        if (this.$__observers__)
            for (var i = 0, j = this.$__observers__.length; i < j; i++) {
                var existed = this.$__observers__.shift();
                if (existed !== handler)
                    this.$__observers__.push(handler);
            }
        return this;
    }
    var Observable = /** @class */ (function () {
        function Observable(schema, parentOrValue, index) {
            var owner, value, old;
            if (schema instanceof Schema) {
                if (parentOrValue instanceof Observable) {
                    owner = parentOrValue;
                    index = (index === undefined || index === null) ? schema.$name : index;
                    old = value = owner.$value[index];
                }
                else {
                    old = value = parentOrValue;
                    owner = undefined;
                }
            }
            else {
                old = value = schema;
                schema = new Schema(undefined, undefined);
                schema.$define(value);
            }
            if (index === undefined || index === null)
                index = schema.$name;
            implicit(this, {
                '$owner': owner,
                '$schema': schema,
                '$value': value,
                '$oldValue': old,
                '$index': index,
                '$get': this.$get,
                '$set': this.$set,
                '$update': this.$update,
                '$__observers__': undefined
            });
            if (schema.$type === ObservableTypes.object) {
                initObjectObservable.call(this);
            }
            else if (schema.$type === ObservableTypes.array) {
                initArrayObservable.call(this);
            }
        }
        Observable.prototype.$get = function (getterType) {
            return getValueObservable.call(this, getterType);
        };
        Observable.prototype.$set = function (value, partial, backwrite) {
            return setValueObservable.call(this, value, partial, backwrite);
        };
        Observable.prototype.$update = function (partialValue, evt) {
            return updateObservable.call(this, partialValue, evt);
        };
        Observable.prototype.$subscribe = function (handler, disposable) {
            return subscribe.call(this, handler);
        };
        Observable.prototype.$unsubscribe = function (handler) {
            return unsibscribe.call(this, handler);
        };
        return Observable;
    }());
    exports.Observable = Observable;
    function getValueObservable(getterType) {
        if (getterType === undefined || getterType === ObservableGetterTypes.newest)
            return this.$value;
        if (getterType === ObservableGetterTypes.old)
            return this.$oldValue;
        if (this.$owner) {
            var target = this.$owner.$get(ObservableGetterTypes.raw);
            return target[this.$schema.$name];
        }
    }
    function setValueObservable(value, partial, backwrite) {
        this.$value = value;
        if (backwrite !== false && this.$super)
            this.$super.$value[this.$index] = value;
        return this;
    }
    function updateObservable(partialValue, evt) {
        var old = this.$oldValue;
        if (partialValue !== undefined) {
            this.$value = partialValue;
            if (this.$owner)
                this.$owner.$value[this.$index] = partialValue;
        }
        this.$oldValue = this.$value;
        if (this.$value === old || evt === false)
            return;
        if (!evt)
            evt = {};
        evt.old = old;
        evt.value = this.$value;
        evt.sender = this;
        notify.call(this, evt);
        return evt;
    }
    implicit(Observable.prototype, {
        '$get': getValueObservable, '$set': setValueObservable, '$update': updateObservable, '$subscribe': subscribe, '$unsubscribe': unsibscribe
    });
    function initObjectObservable() {
        this.$set = setObjectObservable;
        this.$update = updateObjectObservable;
        if (!this.$value) {
            this.$value = {};
            if (this.$owner)
                this.$owner.$get()[this.$schema.$name] = this.$value;
        }
        for (var name_7 in this.$schema) {
            var prop = new Observable(this.$schema[name_7], this);
            Object.defineProperty(this, name_7, { enumerable: true, writable: false, configurable: false, value: prop });
        }
    }
    function setObjectObservable(value, partial, backwrite) {
        value = this.$value = value || {};
        if (backwrite !== false && this.$super)
            this.$super.$value[this.$index] = value;
        if (partial) {
            for (var name_8 in value) {
                var ob = this[name_8];
                if (ob)
                    ob.$set(value[name_8], true, false);
            }
        }
        else {
            for (var name_9 in this)
                this[name_9].$set(value[name_9], undefined, false);
        }
        return this;
    }
    function updateObjectObservable(partialValue, evt0) {
        var _a;
        var evt = evt0;
        if (partialValue) {
            if (evt) {
                for (var name_10 in partialValue) {
                    var ob = this[name_10];
                    if (ob)
                        ob.$set(partialValue[name_10], true, true);
                }
                evt = updateObservable.call(this, undefined, evt);
                if (evt && !evt.cancel) {
                    for (var name_11 in partialValue) {
                        var ob = this[name_11];
                        if (ob)
                            ob.$update(undefined, undefined);
                    }
                }
                return evt;
            }
            else {
                for (var name_12 in partialValue) {
                    var ob = this[name_12];
                    if (ob)
                        ob.$update(partialValue[name_12], ((_a = evt) === null || _a === void 0 ? void 0 : _a.cancel) ? false : undefined);
                }
            }
        }
        else {
            evt = updateObservable.call(this, undefined, evt);
            for (var name_13 in this)
                this[name_13].$update(undefined, (evt && evt.cancel) ? false : undefined);
            return evt;
        }
    }
    function initArrayObservable() {
        this.$set = setArrayObservable;
        this.$update = updateArrayObservable;
        if (!this.$value) {
            this.$value = [];
            if (this.$owner)
                this.$owner.$get()[this.$schema.$name] = this.$value;
        }
        var lengthSchema = new Schema('length', this.$schema);
        var length = new Observable(lengthSchema, this);
        length.$set = function (value) {
            value = parseInt(value) || 0;
            var old = this.$oldValue;
            if (value > old) {
                var arr = this.$super;
                for (var i = old; i < value; i++) {
                    var item = new Observable(arr.$schema.$item, arr, i);
                    Object.defineProperty(arr, i, { enumerable: true, configurable: true, writable: false, value: item });
                }
                this.$value = this.$owner.$value.length = value;
                if (arr.$__length__ < value)
                    arr.$__length__ = value;
            }
            else if (value < old) {
                var arr = this.$super;
                for (var i = value; i < old; i++) {
                    var item = arr[i];
                    Object.defineProperty(arr, i, { enumerable: false, configurable: true, writable: false, value: item });
                }
                this.$value = this.$owner.$value.length = value;
            }
            return this;
        };
        Object.defineProperty(this, 'length', { enumerable: false, writable: false, configurable: true, value: length });
        for (var i = 0, j = this.$value.length; i < j; i++) {
            var item = new Observable(this.$schema.$item, this, i);
            Object.defineProperty(this, item.$index, { enumerable: true, writable: false, configurable: true, value: item });
        }
        Object.defineProperty(this, '$__length__', { enumerable: false, writable: true, configurable: false, value: this.length.$value });
    }
    function setArrayObservable(value, partial) {
        value = this.$value = value || [];
        if (partial) {
            for (var i = 0; i < value.length; i++) {
                var itemValue = value[i];
                var item = this[i];
                if (itemValue !== undefined) {
                    if (item)
                        item.$set(itemValue, true);
                    else
                        this.$value[i] = itemValue;
                }
            }
            if (value.length > this.length.$value)
                this.length.$set(value.length);
        }
        else {
            this.length.$set(value.length);
            this.$value = value;
            for (var i = 0; i < value.length; i++) {
                this[i].$set(value[i]);
            }
        }
        return this;
    }
    function updateArrayObservable(evt0, partialValue) {
        if (partialValue) {
            this.$set(partialValue, true);
        }
        var modifies = [], removes;
        var oldLen = this.length.$oldValue;
        var newLen = this.length.$value;
        var evt = evt0 || {};
        if (oldLen > newLen) {
            removes = [];
            for (var i = newLen; i < oldLen; i++) {
                removes.push(this[i]);
            }
            evt.removes = removes;
        }
        else if (oldLen < newLen) {
            var appends = [];
            for (var i = oldLen; i < newLen; i++) {
                var newItem = this[i];
                if (!newItem) {
                    newItem = new Observable(this.$schema, this, i);
                    this[i] = new newItem;
                }
                appends.push(newItem);
            }
            evt.appends = appends;
        }
        for (var i = newLen; i < this.$__length__; i++) {
            delete this[i];
        }
        this.$__length__ = 0;
        var len = Math.min(oldLen, newLen);
        for (var i = 0; i < len; i++)
            modifies.push(this[i]);
        evt.modifies = modifies;
        evt = updateObservable.call(this, evt0 === null ? null : evt);
        var lenEvt = this.length.$update(evt0 === null ? null : undefined);
        if ((evt && evt.cancel) || (lenEvt && lenEvt.cancel))
            evt = null;
        for (var i = 0; i < len; i++)
            modifies[i].$update(evt === null ? null : undefined);
        if (removes) {
            for (var i = 0; i < removes.length; i++) {
                removes[i].$update({ action: 'removed' });
            }
        }
        return evt;
    }
    var Scope = /** @class */ (function () {
        function Scope(name, sp) {
            implicit(this, {
                '$__scope.name__': name,
                '$__scope.super__': sp
            });
        }
        Scope_1 = Scope;
        Scope.prototype.$declare = function (name, schema, value) {
            return this[name] = new Observable(schema, value, name);
        };
        Scope.prototype.$createScope = function (name) {
            return new Scope_1(name, this);
        };
        Scope.prototype.$resolve = function (name) {
            var ob = this[name];
            if (!ob) {
                var p = this["$__scope.super__"];
                if (p)
                    ob = p.$resolve(name);
            }
            return ob;
        };
        var Scope_1;
        Scope = Scope_1 = __decorate([
            implicit()
        ], Scope);
        return Scope;
    }());
    exports.Scope = Scope;
});
// <table><col slot-scope={x}>{x + model.y}</col></table>
// <ul><li for={each:data.items, as: item}>{item.name + data.name}</li></ul>
//# sourceMappingURL=observable.js.map
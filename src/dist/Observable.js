'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Scope = exports.Observable = exports.Schema = exports.implicit = exports.is_int = exports.is_array = void 0;
function is_array(o) { return Object.prototype.toString.call(o) === '[object Array]'; }
exports.is_array = is_array;
var intRegx = /^\s*[0-9]+\s*$/g;
function is_int(o) {
    if (o === undefined || o === null)
        return false;
    if (o instanceof Number)
        return true;
    return intRegx.test(o.toString());
}
exports.is_int = is_int;
function implicit(target, names) {
    if (target) {
        if (names) {
            if (is_array(names)) {
                for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                    var name = names_1[_i];
                    Object.defineProperty(target, name, { enumerable: false, configurable: true, writable: true, value: target[name] });
                }
            }
            else {
                for (var name in names)
                    Object.defineProperty(target, name, { enumerable: false, configurable: true, writable: true, value: names[name] });
            }
        }
        else
            for (var name in target)
                Object.defineProperty(target, name, { enumerable: false, configurable: true, writable: true, value: target[name] });
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
        for (var name_1 in target)
            Object.defineProperty(target, name_1, { enumerable: false, configurable: true, writable: true, value: target[name_1] });
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
                for (var name in value) {
                    this.$prop(name).$define(value[name]);
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
                var name = p.$name;
                if (name === undefined || name === null)
                    name = '';
                names.unshift(name);
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
var ObservableGetterTypes;
(function (ObservableGetterTypes) {
    ObservableGetterTypes[ObservableGetterTypes["newest"] = 0] = "newest";
    ObservableGetterTypes[ObservableGetterTypes["old"] = 1] = "old";
    ObservableGetterTypes[ObservableGetterTypes["raw"] = 2] = "raw";
})(ObservableGetterTypes || (ObservableGetterTypes = {}));
function getValue(getterType) {
    if (getterType === undefined || getterType === ObservableGetterTypes.newest)
        return this.$value;
    if (getterType === ObservableGetterTypes.old)
        return this.$oldValue;
    if (this.$owner) {
        var target = this.$owner.$get(ObservableGetterTypes.raw);
        return target[this.$schema.$name];
    }
}
function setValue(value) {
    this.$value = value;
    return this;
}
function notify(evt) {
    if (this.$__valuechanges__) {
        for (var i = 0, j = this.$__valuechanges__.length; i < j; i++) {
            if (this.$__valuechanges__[i].call(this, evt) === false)
                return evt;
        }
    }
    return evt;
}
function subscribe(handler) {
    (this.$__valuechanges__ || (this.$__valuechanges__ = [])).push(handler);
    return this;
}
function unsibscribe(handler) {
    if (this.$__valuechanges__)
        for (var i = 0, j = this.$__valuechanges__.length; i < j; i++) {
            var existed = this.$__valuechanges__.shift();
            if (existed !== handler)
                this.$__valuechanges__.push(handler);
        }
    return this;
}
function updateObservable(evt) {
    if (this.$value == this.$oldValue && !evt)
        return;
    if (!evt)
        evt = {};
    evt.old = this.$oldValue;
    evt.value = this.$value;
    evt.sender = this;
    this.$oldValue = this.$value;
    if (this.$owner)
        this.$owner.$get()[this.$schema.$name] = this.$value;
    notify.call(this, evt);
    return evt;
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
            '$__valuechanges__': undefined
        });
        if (schema.$type === ObservableTypes.object) {
            initObjectObservable.call(this);
        }
        else if (schema.$type === ObservableTypes.array) {
            initArrayObservable.call(this);
        }
    }
    Observable.prototype.$get = function (getterType) {
        return getValue.call(this, getterType);
    };
    Observable.prototype.$set = function (value) {
        return setValue.call(this, value);
    };
    Observable.prototype.$update = function (evt) {
        return updateObservable.call(this, evt);
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
implicit(Observable.prototype, {
    '$get': getValue, '$set': setValue, '$update': updateObservable, '$subscribe': subscribe, '$unsubscribe': unsibscribe
});
function initObjectObservable() {
    this.$set = setObjectValue;
    this.$update = updateObjectObservable;
    if (!this.$value) {
        this.$value = {};
        if (this.$owner)
            this.$owner.$get()[this.$schema.$name] = this.$value;
    }
    for (var name in this.$schema) {
        var prop = new Observable(this.$schema[name], this);
        Object.defineProperty(this, name, { enumerable: true, writable: false, configurable: false, value: prop });
    }
}
function setObjectValue(value) {
    value = this.$value = value || {};
    for (var name in this)
        this[name].$set(value[name]);
    return this;
}
function updateObjectObservable(evt) {
    evt = updateObservable.call(this, evt);
    if (evt && evt.cancel)
        return evt;
    for (var name in this)
        this[name].$update();
    return evt;
}
function initArrayObservable() {
    this.$set = setArrayValue;
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
        this.$value = this.$owner.$value.length = value;
        return this;
    };
    Object.defineProperty(this, 'length', { enumerable: false, writable: false, configurable: true, value: length });
    for (var i = 0, j = this.$value.length; i < j; i++) {
        var item = new Observable(this.$schema.$item, this, i);
        Object.defineProperty(this, item.$index, { enumerable: true, writable: false, configurable: true, value: item });
    }
}
function setArrayValue(value) {
    value = this.$value = value || [];
    var len = this.length.$get();
    this.length.$set(value.length);
    for (var i = 0, j = len; i < j; i++) {
        this[i.toString()].$set(value[i]);
    }
    for (var i = len, j = value.length; i < j; i++) {
        var item = new Observable(this.$schema.$item, this, i);
        Object.defineProperty(this, item.$index, { enumerable: true, writable: false, configurable: true, value: item });
    }
    return this;
}
function updateArrayObservable(evt) {
    if (this.length.$oldValue > this.length.$value) {
        var removes = [];
        for (var i = this.length.$value, j = this.length.$oldValue; i < j; i++)
            removes.push(this[i]);
        (evt || (evt = {})).removes = removes;
    }
    else if (this.length.$oldValue < this.length.$value) {
        var appends = [];
        for (var i = this.length.$oldValue, j = this.length.$value; i < j; i++)
            appends.push(this[i]);
        (evt || (evt = {})).appends = appends;
    }
    evt = updateObservable.call(this, evt);
    if (evt && evt.cancel) {
        this.length.$oldValue = this.length.$value;
        return evt;
    }
    var lenEvt = this.length.$update();
    var len = this.length.$get();
    for (var i = 0; i < len; i++)
        this[i].$update();
    if (lenEvt) {
        if (lenEvt.old > lenEvt.value) {
            for (var i = len; i < lenEvt.old; i++) {
                var item = this[i];
                item.$update({ action: 'removed' });
            }
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

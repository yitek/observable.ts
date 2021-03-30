var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (window) {
    // a = a0.then((v)=>promise(v)).then((v)=>{})
    var FulfillStates;
    (function (FulfillStates) {
        FulfillStates[FulfillStates["padding"] = 0] = "padding";
        FulfillStates[FulfillStates["fulfilled"] = 1] = "fulfilled";
        FulfillStates[FulfillStates["rejected"] = 2] = "rejected";
    })(FulfillStates || (FulfillStates = {}));
    var microRun;
    try {
        microRun = globalThis.setImmediate;
    }
    catch (_a) { }
    if (!microRun)
        microRun = function (fn) { return setTimeout(fn, 0); };
    function thenable(deferFn, target) {
        if (!target) {
            target = this;
            if (!target || target === window || target === globalThis)
                target = {};
        }
        var ffValue;
        var ffStatus = FulfillStates.padding;
        var callbacks;
        var handleCallback = function (cb) {
            if (ffStatus === FulfillStates.fulfilled) {
                if (!cb.onFulfilled) { // onFullfilled如果是空，就把结果直接传给下一个then
                    cb.resolve(ffValue);
                    return;
                }
                var ret = cb.onFulfilled(ffValue);
                cb.resolve(ret); // 链式调用的关键，把返回结果传递给下一个resolve
                return;
            }
            if (ffStatus === FulfillStates.rejected) {
                if (!cb.onRejected) { // onFullfilled如果是空，就把结果直接传给下一个then
                    cb.reject(ffValue);
                    return;
                }
                cb.onRejected(ffValue);
                //cb.reject(ffValue)
            }
        };
        var then = function (onFulfilled, onRejected) {
            return thenable(function (resolve, reject) {
                var cb = {
                    onFulfilled: onFulfilled,
                    onRejected: onRejected,
                    resolve: resolve,
                    reject: reject
                };
                if (ffStatus === FulfillStates.padding) { // 异步的话就先存着，后面再执行
                    (callbacks || (callbacks = [])).push(cb);
                    return;
                }
                handleCallback(cb);
            });
        };
        var resolve = function (value) {
            if (ffStatus !== FulfillStates.padding)
                throw TypeError('already fullfiled');
            // resolve传过来的，除了数值，还有可能是上一个then返回的promise，下面这个if主要处理这种情况
            if (value && (typeof value === 'object' || typeof value === 'function')) {
                var then = value.then;
                if (typeof then === 'function') {
                    then.call(value, resolve, reject); // 如果是一个promise，则调用它的then
                    return;
                }
            }
            ffStatus = FulfillStates.fulfilled;
            ffValue = value;
            if (!callbacks)
                return;
            for (var i = 0, j = callbacks.length; i < j; i++) {
                var cb = callbacks[i];
                if (!cb.onFulfilled) {
                    cb.resolve(ffValue);
                    continue;
                }
                var ret = cb.onFulfilled(ffValue);
                cb.resolve(ret); // 链式调用的关键，把返回结果传递给下一个resolve
            }
            callbacks = undefined;
        };
        var reject = function (err) {
            if (ffStatus !== FulfillStates.padding)
                throw TypeError('already fullfiled');
            ffValue = err;
            ffStatus = FulfillStates.rejected;
            if (!callbacks)
                return;
            for (var i = 0, j = callbacks.length; i < j; i++) {
                var cb = callbacks[i];
                if (cb.onRejected)
                    cb.onRejected(ffValue);
                //if(cb.reject) cb.reject(ffValue)
            }
            callbacks = undefined;
        };
        Object.defineProperty(target, "then", { enumerable: false, configurable: true, writable: true, value: then });
        if (deferFn) {
            microRun(function () {
                try {
                    deferFn(resolve, reject);
                }
                catch (ex) {
                    reject(ex);
                }
            });
        }
        return target;
    }
    function PromiseA(fn) { return thenable.call(this, fn); }
    window.thenable = thenable;
    window.PromiseA = PromiseA;
    try {
        if (typeof Promise === 'undefined') {
            window.Promise = PromiseA;
        }
    }
    catch (_b) {
        if (!window.Promise)
            window.Promise = PromiseA;
    }
})(typeof window !== 'undefined' ? window : globalThis);
(function (window) {
    var none = {};
    function event(name, target) {
        var callbacks;
        var fulfill = none;
        var facade = function (handler) {
            if (typeof handler === 'function') {
                if (name === true && fulfill !== none) {
                    handler(fulfill);
                }
                else {
                    (callbacks || (callbacks = [])).push(handler);
                }
                return this;
            }
            if (name === true)
                fulfill = handler;
            if (!callbacks)
                return this;
            for (var i = 0, j = callbacks.length; i < j; i++) {
                callbacks[i].call(this, handler);
            }
            return this;
        };
        facade.remove = function (handler) {
            if (callbacks) {
                var rs = false;
                for (var i = 0, j = callbacks.length; i < j; i++) {
                    var callback = callbacks.shift();
                    if (callback !== handler)
                        callbacks.push(callback);
                    else
                        rs = true;
                }
                return rs;
            }
            return false;
        };
        if (target && name && name !== true)
            target[name] = facade;
        return facade;
    }
    window.EVENT = event;
})(typeof window !== 'undefined' ? window : globalThis);
(function (window) {
    window.module = undefined;
    window.exports = {};
    /**
     * 获取document的head的函数
     *
     * @param {{[name:string]:any}} initModules
     */
    var head = function () {
        var headElem = Resource.headElement;
        if (headElem)
            return headElem;
        //if(headElem && headElem.parentElement==document.documentElement) return headElem
        var elems = document.getElementsByTagName("head");
        if (!elems || elems.length == 0) {
            //如果找不到head元素，就创建一个
            headElem = document.createElement("head");
            try {
                //试图再documentElement中添加head元素
                if (document.documentElement.firstChild)
                    document.documentElement.insertBefore(headElem, document.documentElement.firstChild);
                else
                    document.documentElement.appendChild(headElem);
            }
            catch (ex) {
                //无法在documentElement中添加head元素，在body中添加一个
                headElem = document.createElement("div");
                headElem.style.display = "none";
                headElem.id = "ya-require-head";
                var refScript = document.scripts[0];
                if (refScript) {
                    refScript.parentNode.insertBefore(headElem, refScript);
                }
                else {
                    if (!document.body)
                        throw new Error("无法在documentElement/body中创建script");
                    if (document.body.firstChild)
                        document.body.insertBefore(headElem, document.body.firstChild);
                    else
                        document.body.appendChild(headElem);
                }
            }
        }
        else {
            headElem = elems[0];
        }
        return Resource.headElement = headElem;
    };
    /**
     * 给对象附加状态函数
     * 所谓状态函数是这样一个东西
     *  subject.ready(onready);该状态处于终值时，onready会被调用
     * subject.ready({}); 给该状态设置终值
     * subject.ready();获取该状态的终值，
     *
     * @param {*} obj
     * @param {string[]} names
     * @param {number} step
     */
    function makeState(obj, names, error_name, step) {
        if (step === undefined) {
            for (var i in names)
                makeState(obj, names, error_name, i);
            //for(let i in names) EVENT()
            return;
        }
        var name = names[step];
        var privateName = '__' + name;
        if (error_name)
            error_name = "__" + error_name;
        //obj[name]其实是状态函数
        obj[name] = function (valOrCallback) {
            if (valOrCallback === undefined) {
                var val = this[privateName];
                if (val && val.fulfilled)
                    return val.value;
                return undefined;
            }
            if (typeof valOrCallback === "function") {
                var callbacks = this[privateName] || (this[privateName] = []);
                callbacks.push(valOrCallback);
                return this;
            }
            else {
                if (error_name && privateName !== error_name) {
                    var err = this[error_name];
                    if (err && err.fulfilled) {
                        console.warn("该对象已经处于" + error_name + "状态,忽略其他状态的终值");
                        return this;
                    }
                }
                var cstep = this.__step;
                if (cstep >= step)
                    throw Error("\u5BF9\u8C61\u5DF2\u7ECF\u5904\u4E8E[" + this.__stepname + "=" + cstep + "]\u7EC8\u503C\u72B6\u6001\uFF0C\u65E0\u6CD5\u518D\u7ED9\u8BE5\u72B6\u6001\u6307\u5B9A[" + name + "=" + step + "]\u6307\u5B9A\u7EC8\u503C");
                this.__step = step;
                this.__stepname = name;
                var callbacks = this[privateName];
                this[privateName] = { fulfilled: true, value: valOrCallback };
                this[name] = function (valOrCallback) {
                    if (valOrCallback === undefined)
                        return this[privateName].value;
                    if (typeof valOrCallback !== "function")
                        throw new Error("\u5BF9\u8C61\u7684[" + name + "]\u5DF2\u7ECF\u5F97\u5230\u7EC8\u503C\uFF0C\u4E0D\u80FD\u518D\u8BBE\u7F6E\u7EC8\u503C");
                    valOrCallback.call(this, this[privateName].value);
                    return this;
                };
                if (callbacks)
                    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                        var callback = callbacks_1[_i];
                        callback.call(this, valOrCallback);
                    }
                return this;
            }
        };
    }
    /**
     * 表示url的各个部分
     * 可以通过basePaths参数来获取url的绝对值
     *
     * @class Uri
     */
    var Uri = /** @class */ (function () {
        function Uri(url, basPaths, resolveUrl) {
            this.orignal = url;
            url = this.resolved = resolveUrl ? resolveUrl(url) : url;
            var paths = this.paths = [];
            if (basPaths)
                for (var i = 0, j = basPaths.length; i < j; i++)
                    paths.push(basPaths[i]);
            var names = url.split('/');
            for (var i = 0, j = names.length - 1; i < j; i++) {
                var n = names[i].replace(/(^\s+)|(\s+)$/g, "");
                if (n === "." && paths.length)
                    continue;
                else if (n === "..") {
                    if (paths.length) {
                        var n1 = paths.pop();
                        if (n1[0] == '.')
                            paths.push(n1);
                        else
                            continue;
                    }
                }
                else if (!n)
                    continue;
                paths.push(n);
            }
            var name = names[names.length - 1];
            if (name.lastIndexOf(".js") !== name.length - 3)
                name += ".js";
            this.filename = name;
            if (paths.length)
                this.url = paths.join("/") + "/" + name;
            else
                this.url = name;
            var lastIndex = this.filename.lastIndexOf(".");
            if (lastIndex > 0)
                this.ext = this.filename.substr(lastIndex + 1);
        }
        return Uri;
    }());
    //////////////////////////////////////////////////////////////////////////////////////////
    // Resource
    /**
     * 代表要加载的资源
     *
     * @class Resource
     * @extends {Ready}
     * @implements {IRequireResource}
     */
    var Resource = /** @class */ (function () {
        function Resource(uri) {
            var _this = this;
            this.uri = uri;
            //获取url字符串，可能会追加一个随机数防止缓存
            var url = this.url = this._makeUrl(uri.url);
            //创建dom元素
            var elem = this.element = this._createElement(url);
            //设置完成的回调函数
            if (elem.onload !== undefined)
                elem.onload = function () {
                    if (elem.src.indexOf('mock-fra.js') >= 0) {
                        console.log("elem.onload", elem);
                    }
                    if (define.trace === true || define.trace === "loaded")
                        console.info("[\u8D44\u6E90][loaded ]:" + url);
                    // if(url.indexOf("framework")>=0) debugger
                    _this.loaded(_this);
                };
            else
                elem.onreadystatechange = function () {
                    if (elem.src.indexOf('mock-fra.js') >= 0) {
                        console.log(elem.readyState);
                    }
                    if (elem.readyState === 4 || elem.readyState === "complete") {
                        if (define.trace === true || define.trace === "loaded")
                            console.info("[\u8D44\u6E90][loaded ]:" + url);
                        _this.loaded(_this);
                    }
                };
            //设置出错的回调函数
            elem.onerror = function (err, ex) {
                console.error("[资源][error  ]:" + _this.url, err, ex, _this);
                _this.error(err);
            };
            //将元素添加到head中
            if (define.trace === true || define.trace === "loading")
                console.info("[\u8D44\u6E90][loading]:" + url);
            this._load();
        }
        Resource.prototype._makeUrl = function (url) {
            if (url.indexOf("?") > 0)
                url += "&";
            else
                url += "?";
            url += Math.random();
            return url;
        };
        Resource.prototype._createElement = function (url) {
            throw new Error("abstract method");
        };
        Resource.prototype._load = function () {
            head().appendChild(this.element);
        };
        Resource.load = function (opts) {
            var uri, type;
            if (opts instanceof Uri) {
                uri = opts;
            }
            else if (typeof opts === "object") {
                uri = new Uri(opts.url);
                type = opts.type;
            }
            else {
                uri = new Uri(opts);
            }
            if (!type) {
                if (uri.ext === "css")
                    return new StylesheetResource(uri);
                else
                    return new ScriptResource(uri);
            }
            else {
                if (type == "css")
                    return new StylesheetResource(uri);
                else
                    return new ScriptResource(uri);
            }
        };
        return Resource;
    }());
    makeState(Resource.prototype, ["loaded", "error"], "error");
    var ScriptResource = /** @class */ (function (_super) {
        __extends(ScriptResource, _super);
        function ScriptResource(uri) {
            var _this = _super.call(this, uri) || this;
            _this.type = "js";
            return _this;
        }
        ScriptResource.prototype._createElement = function (url) {
            var elem = document.createElement("script");
            elem.type = "text/javascript";
            elem.src = url;
            return elem;
        };
        return ScriptResource;
    }(Resource));
    var StylesheetResource = /** @class */ (function (_super) {
        __extends(StylesheetResource, _super);
        function StylesheetResource(uri) {
            var _this = _super.call(this, uri) || this;
            _this.type = "css";
            return _this;
        }
        StylesheetResource.prototype._createElement = function (url) {
            var elem = document.createElement("link");
            elem.type = "text/css";
            elem.href = url;
            elem.rel = "stylesheet";
            return elem;
        };
        return StylesheetResource;
    }(Resource));
    var DependenceNotDefinedException = /** @class */ (function (_super) {
        __extends(DependenceNotDefinedException, _super);
        function DependenceNotDefinedException(msg, majorModule, depModule) {
            var _this = _super.call(this, msg) || this;
            _this.majorModule = majorModule;
            _this.depModule = depModule;
            _this.isDependenceNotDefinedException = true;
            return _this;
        }
        return DependenceNotDefinedException;
    }(Error));
    ////////////////////////////////////////////////////////////////
    // Module
    var modules = {};
    var Module = /** @class */ (function () {
        function Module(opts) {
            var _this = this;
            this.opts = opts;
            //获取uri与url    
            if (!opts.url)
                throw new Error('必须要有url');
            if (opts.url instanceof Uri)
                this.uri = opts.url;
            else
                this.uri = new Uri(opts.url);
            if (this.uri.ext !== "js") {
                this.uri.ext = "js";
                this.uri.url += ".js";
                this.uri.filename += ".js";
            }
            this.alias(this.url = define.resolve(this.uri.url));
            this.deps = {};
            this.name = opts.name;
            if (!this.name)
                this.name = this.url;
            else if (this.url != this.name)
                this.alias(self.name, true);
            if (opts.value) {
                this.definin(null);
                this.defined(opts.value);
                return;
            }
            if (define.trace === true || define.trace === "initing")
                console.info("[\u6A21\u5757][initing]:" + this.url);
            this.resource = Resource.load(this.uri).loaded(function (elem) {
                var execution = DefineExecution.current;
                DefineExecution.current = undefined;
                if (!execution) {
                    if (define.trace === true || define.trace === "loaded")
                        console.info("[\u6A21\u5757][definin ]:" + _this.url);
                    _this.definin(elem);
                    var exports = window.exports;
                    //其他模块被加载的时候就不会使用该模块的exports了。
                    window.exports = {};
                    console.warn("[\u6A21\u5757][defined]" + _this.url + ".\u672A\u7528define\u5B9A\u4E49\u6A21\u5757,\u4F7F\u7528\u5168\u5C40\u7684exports\u4F5C\u4E3A\u8BE5\u6A21\u5757\u7684\u8F93\u51FA\u3002");
                    _this.defined(exports);
                    return;
                }
                //把module注入到当前上下文中
                //上下文会在setTimout(0)后执行模块的factory
                execution.module = _this;
            }).error(function (ex) {
                console.error("资源加载错误", ex);
                _this.error(ex);
            });
        }
        Module.prototype.alias = function (name, force) {
            if (!this.aliases)
                this.aliases = [];
            var existed = modules[name];
            if (existed) {
                if (existed === this)
                    return this;
                if (force) {
                    console.warn("\u6A21\u5757[" + name + "]\u88AB\u66FF\u6362\u6389\u4E86", existed, this);
                }
                else
                    throw new Error("\u6A21\u5757[" + name + "]\u88AB\u66FF\u6362\u6389\u4E86");
            }
            else {
                for (var i = 0, j = this.aliases.length; i < j; i++) {
                    var n = this.aliases.shift();
                    if (n !== name)
                        this.aliases.push(n);
                }
                this.aliases.push(name);
            }
            modules[name] = this;
        };
        Module.fetch = function (name, requireModule) {
            var _a;
            if (!name)
                throw new Error("无法获取模块,未指定模块名/url");
            var existed = define.modules[name];
            if (!existed) {
                var uri = new Uri(name, (_a = requireModule) === null || _a === void 0 ? void 0 : _a.uri.paths);
                existed = define.modules[uri.url];
                //Module构造函数会往modules里面写数据
                if (!existed)
                    existed = new Module({ url: uri });
            }
            return existed;
        };
        Module.caches = modules;
        return Module;
    }());
    makeState(Module.prototype, ["definin", "defined", "error"], "error");
    /**
     * define函数的执行器
     * 真正的define的操作是由该类完成
     *
     * @class DefineExecution
     */
    var DefineExecution = /** @class */ (function () {
        function DefineExecution(name, depnames, factory) {
            var _this = this;
            this.name = name;
            this.depnames = depnames;
            this.factory = factory;
            DefineExecution.current = this;
            this.exports = {};
            this.factoryArguments = [];
            this.waitingCount = this.depnames.length + 1; //execute会调用一次tryResolve.
            var require = this.require;
            this.require = function (name) { return require.call(_this, name); };
        }
        DefineExecution.prototype.execute = function () {
            var _this = this;
            // 由于执行顺序问题，define函数中的setTimeout(,0)可能在onload之前被执行
            // 这种情况发生时，module还没有，等同该defination还未准备好，再等待一轮
            if (!this.module) {
                setTimeout(function () { return _this.execute(); }, 1);
                return false;
            }
            if (define.trace === true || define.trace === "collect")
                console.info("[\u6A21\u5757][collect]" + this.module.url + "\u6B63\u5728\u6536\u96C6\u4F9D\u8D56");
            if (this.module.error()) {
                console.warn("\u6A21\u5757[" + this.module.url + "]\u5904\u4E8E\u9519\u8BEF\u72B6\u6001\uFF0C\u4E0D\u4F1A\u6267\u884Cdefine", this.module);
                return this;
            }
            for (var index in this.depnames)
                (function (depname, idx) {
                    if (depname === "exports") {
                        _this.factoryArguments[idx] = _this.exports;
                        _this.waitingCount--;
                        return;
                    }
                    else if (depname === "require") {
                        _this.factoryArguments[idx] = _this.require;
                        _this.waitingCount--;
                        return;
                    }
                    else {
                        var depModule_1 = Module.fetch(depname, _this.module);
                        _this.module.deps[depModule_1.name] = depModule_1;
                        depModule_1.defined(function (value) {
                            _this.factoryArguments[idx] = value;
                            if (define.trace == true || define.trace === "depend")
                                console.info("[\u6A21\u5757][depend ]:" + _this.module.url, _this.waitingCount, "[defined]:" + depModule_1.url);
                            _this.tryResolve();
                        });
                    }
                })(this.depnames[index], index);
            if (define.trace === true || define.trace === "definin")
                console.info("[\u6A21\u5757][definin]" + this.module.url, "[等待依赖项]", this.waitingCount - 1);
            this.module.definin(this.module);
            var stack = [this.module.url];
            checkCycle(this.module.deps, this.module, stack, function (rs) {
                if (rs === false) {
                    console.error("依赖项循环引用", stack);
                    _this.module.error("依赖项重复引用");
                    return;
                }
                _this.tryResolve();
            });
            return true;
        };
        DefineExecution.prototype.require = function (name) {
            //获取到指定的module
            var mod = Module.fetch(name, this.module);
            var definedValue = mod.defined();
            if (definedValue === undefined) {
                //丢出Define的异常
                throw new DependenceNotDefinedException("module[" + name + " is not ready.", this.module, mod);
            }
            return definedValue;
        };
        ;
        DefineExecution.prototype.tryResolve = function () {
            var _this = this;
            if (--this.waitingCount === 0) {
                var success = false;
                var result = void 0;
                var global_exports = window.exports;
                if (define.trace)
                    console.info("[\u6A21\u5757][definin]" + this.module.url + "\u5F00\u59CB\u6267\u884Cdefine.factory");
                try {
                    window.exports = this.exports;
                    result = this.factory.apply(this, this.factoryArguments);
                    success = true;
                }
                catch (ex) {
                    //如果丢出了DependenceNotDefinedException一场
                    //表示在factory里面调用了require(name)，而且该模块还未准备好
                    if (ex.isDependenceNotDefinedException) {
                        if (define.trace)
                            console.info("[\u6A21\u5757][breakin]" + this.module.url, "[\u4F9D\u8D56\u9879][\u672A\u5B9A\u4E49]" + ex.depModule.url);
                        this.waitingCount++;
                        ex.depModule.defined(function (mod) { return _this.tryResolve(); });
                        return;
                    }
                    else
                        throw ex;
                }
                finally {
                    window.exports = global_exports;
                }
                if (success) {
                    if (define.trace)
                        console.info("[\u6A21\u5757][defined]" + this.module.url);
                    this.module.defined(result || this.exports);
                }
            }
        };
        return DefineExecution;
    }());
    function checkCycle(modules, target, stack, callback) {
        var count = 1;
        var hasError = false;
        for (var n in modules) {
            var module = modules[n];
            stack.push(module.url);
            if (module === target) {
                hasError = true;
                return callback.call(this, false);
            }
            count++;
            module.definin(function (mod) {
                checkCycle(this.deps, target, stack, function (rs) {
                    if (rs === true) {
                        if (!hasError && --count == 0)
                            callback(true);
                    }
                    else {
                        hasError = true;
                        callback(false);
                    }
                });
            });
        }
        if (--count == 0 && !hasError)
            callback(true);
    }
    var define = function (name, deps, factory) {
        //整理参数
        //define(name,deps,statement)
        if (factory === undefined) {
            // define(deps,statement) or define(name,value)
            if (typeof name === "string") {
                //define(name);
                if (deps === undefined) {
                    return Module.fetch(name, null);
                }
                //define(name,value);
                var value = deps;
                if (value === undefined)
                    throw new Error("不可以定义undefined到module中");
                var existed = define.modules[name];
                if (existed) {
                    var def_value = existed.defined();
                    if (def_value === value)
                        return;
                    console.warn("Module[" + name + "] is replaced.", value, existed);
                }
                return new Module({ name: name, value: value });
            }
            else {
                factory = deps;
                deps = name;
                name = undefined;
            }
            if (factory === undefined) {
                //define(statement);
                factory = deps;
                deps = undefined;
            }
        }
        if (typeof factory !== "function")
            throw new Error("不正确的参数,define的最后一个参数应该是函数");
        var context = DefineExecution.current = define.context = new DefineExecution(name, deps, factory);
        //延迟执行，要等load函数把module注入进去
        setTimeout(function () { return context.execute(); }, 1);
    };
    define.modules = modules;
    define.amd = true;
    define.trace = false;
    define.require = Module.fetch;
    define.Resource = Resource;
    var urlResolveRules = {};
    var resolve = define.resolve = function (url) {
        for (var n in urlResolveRules) {
            var rule = urlResolveRules[n];
            var newUrl = url.replace(rule.regex, rule.replacement);
            if (newUrl !== url)
                return url;
        }
        return url;
    };
    resolve.item = function (name, reg, replacement) {
        if (reg === undefined)
            return urlResolveRules[name];
        if (reg == null) {
            delete urlResolveRules[name];
            return;
        }
        if (typeof reg === "string")
            reg = new RegExp(reg);
        urlResolveRules[name] = { regex: reg, replacement: replacement };
        return resolve;
    };
    resolve.rules = urlResolveRules;
    window.define = define;
    ////////////////////////////////////////////////////////////////////////////////////
    // 启动与全局配置
    function boot() {
        var scripts = document.scripts;
        var _loop_1 = function (j) {
            var script = scripts[j];
            var init_module = script.getAttribute("require-startup") || script.getAttribute("startup") || script.getAttribute("require-init");
            if (init_module) {
                var trace = script.getAttribute("require-trace");
                if (trace === "" || trace === "true" || trace === "trace" || trace === "require-trace")
                    define.trace = true;
                else
                    define.trace = trace;
                if (define.trace)
                    console.info("[启动][startup]:" + init_module);
                Module.fetch(init_module).defined(function () {
                    if (define.trace)
                        console.info("[启动][complet]:" + init_module);
                });
                return "break";
            }
        };
        for (var j = scripts.length - 1; j >= 0; j--) {
            var state_1 = _loop_1(j);
            if (state_1 === "break")
                break;
        }
        if (window.removeEventListener)
            window.removeEventListener("load", boot, false);
        else if (window.detechEvent)
            window.detechEvent("onload", boot);
        else
            window.onload = null;
    }
    if (window.addEventListener)
        window.addEventListener("load", boot, false);
    else if (window.attachEvent)
        window.attachEvent("onload", boot);
    else
        window.onload = boot;
})(typeof window !== 'undefined' ? window : undefined);
(function (window) {
    var createXHR = function () {
        var XHR = [
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
            function () { return new ActiveXObject("Msxml3.XMLHTTP"); },
            function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
        ];
        var xhr = null;
        //尝试调用函数，如果成功则返回XMLHttpRequest对象，否则继续尝试
        for (var i = 0; i < XHR.length; i++) {
            try {
                xhr = XHR[i]();
                createXHR = XHR[i];
            }
            catch (e) {
                continue; //如果发生异常，则继续下一个函数调用
            }
            break; //如果成功，则中止循环
        }
        return xhr; //返回对象实例
    };
    function request(opts) {
        var _this = this;
        return thenable(function (resolve, reject) {
            var xhr = createXHR();
            var params = opts;
            params.method = (opts.method || "GET").toUpperCase();
            params.async = opts.async !== false;
            params.headers = opts.headers || {};
            if (_this.requesting)
                _this.requesting(params);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                    }
                    else {
                        handleResponse(xhr, opts, resolve, reject);
                    }
                }
            };
            xhr.onerror = function (e) {
                handlerError(xhr, e, opts, reject);
            };
            var url = params.url;
            var data = params.data;
            if (params.method === 'GET') {
                if (data) {
                    var qry = makeRequestData('', params.data);
                    if (url.indexOf("?"))
                        url += '&';
                    else
                        url += '?';
                    url += qry;
                }
                data = null;
            }
            else {
                data = makeRequestData(params.type, data);
            }
            if (params.headers) {
                for (var n in params.headers) {
                    xhr.setRequestHeader(n, params.headers[n]);
                }
            }
            xhr.open(params.method, url, params.async);
            xhr.send(data);
        });
    }
    function makeRequestData(type, data) {
        if (type === 'json')
            return JSON.stringify(data);
        if (typeof data === 'object') {
            var txts = [];
            for (var n in data) {
                var val = data[n];
                if (val === undefined || val === null)
                    val = '';
                if (txts.length)
                    txts.push('&');
                txts.push(encodeURIComponent(n));
                txts.push('=');
                txts.push(encodeURIComponent(val));
            }
            return txts.join('');
        }
        return data.toString();
    }
    var blockCommetInJsonRegx = /\/\/[^\n]*\n/g;
    function handlerError(xhr, ex, opts, reject) {
        var err = {
            xhr: xhr,
            opts: opts,
            message: ex.message,
            detail: ex
        };
        if (opts.error)
            opts.error.call(xhr, err);
        if (opts.done)
            opts.done.call(xhr, undefined, err);
        reject(err);
    }
    function handleResponse(xhr, opts, resolve, reject) {
        var retData;
        try {
            var responseHandler = responseHandlers[opts.dataType];
            if (!responseHandler)
                responseHandler = responseHandlers[''];
            retData = responseHandler(xhr, opts);
        }
        catch (ex) {
            handlerError(xhr, ex, opts, reject);
            return;
        }
        resolve(retData);
    }
    var responseHandlers = {
        "": function (xhr, opts) { return xhr.responseText; },
        "json": function (xhr, opts) {
            var text = xhr.responseText;
            text = text.replace(blockCommetInJsonRegx, "");
            return JSON.parse(text);
        }
    };
    var AJAX = {
        request: null,
        make: function (name, factory) {
            if (factory === undefined) {
                factory = name;
                name = undefined;
            }
            var req = function (opts) {
                return request.call(factory, opts);
            };
            if (name)
                AJAX[name] = req;
            return req;
        }
    };
    AJAX.make('request', AJAX);
    window.AJAX = AJAX;
    window.ajax = AJAX.request;
})(typeof window !== 'undefined' ? window : undefined);
//# sourceMappingURL=require.js.map
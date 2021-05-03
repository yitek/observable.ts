define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assertTokenRegx = /\(([^\)]+)\)/gi;
    var rtrimRegx = /\s+$/gi;
    var trimRegx = /^\s+|\s+$/gi;
    var tokenRegx = /(?:\\\{)|(\{([^\{}]+)\})/gi;
    function replace_token(content, data) {
        if (content === null || content === undefined)
            return "";
        if (data)
            return content.toString().replace(tokenRegx, function (t, t0, tname) { return data[tname]; });
        return content.toString();
    }
    var Assert = /** @class */ (function () {
        function Assert() {
            this.results = [];
        }
        Assert.prototype.message = function (content, data) {
            this.results.push({
                type: Assert.prototype.message,
                message: replace_token(content, data),
                assertValue: true
            });
            return this;
        };
        Assert.prototype.compare = function (expected, actual, message) {
            var d = {
                type: Assert.prototype.compare,
                message: message,
                expected: JSON.stringify(expected),
                actual: JSON.stringify(actual),
                assertValue: compare(expected, actual)
            };
            d.message = message ? replace_token(message, d) : "";
            this.results.push(d);
            return this;
        };
        Assert.prototype.equal = function (expected, actual, message) {
            var d = {
                type: Assert.prototype.equal,
                message: message,
                expected: expected,
                actual: actual,
                assertValue: expected === actual
            };
            d.message = message ? replace_token(message, d) : "";
            this.results.push(d);
            return this;
        };
        Assert.prototype.true = function (value, message) {
            var d = {
                type: Assert.prototype.equal,
                message: message,
                value: value,
                assertValue: value === true
            };
            d.message = message ? replace_token(message, d) : "true";
            this.results.push(d);
            return this;
        };
        Assert.prototype.false = function (value, message) {
            var d = {
                type: Assert.prototype.equal,
                message: message,
                value: value,
                assertValue: value === false
            };
            d.message = message ? replace_token(message, d) : "false";
            this.results.push(d);
            return this;
        };
        return Assert;
    }());
    exports.Assert = Assert;
    var _loop_1 = function (n) {
        var afn = Assert.prototype[n];
        if (typeof afn === 'function')
            afn.toString = function () { return n; };
    };
    for (var n in Assert.prototype) {
        _loop_1(n);
    }
    function compare(expected, actual) {
        if (!expected || !actual)
            return expected === actual;
        var t = typeof expected;
        if (t !== 'object')
            return expected === actual;
        if (typeof expected.push === 'function' && expected.length !== undefined) {
            if (expected.length !== actual.length)
                return false;
            for (var i in expected) {
                if (!compare(expected[i], actual[i]))
                    return false;
            }
            return true;
        }
        for (var n in expected) {
            if (!compare(expected[n], actual[n]))
                return false;
        }
        for (var n in actual) {
            if (!compare(expected[n], actual[n]))
                return false;
        }
        return true;
    }
    function makeCodes(fn, as) {
        var codes = fn.toString().split('\n');
        var line = codes.shift();
        var match = assertTokenRegx.exec(line);
        assertTokenRegx.lastIndex = 0;
        if (!match)
            return false;
        var assertCodeRegx = new RegExp('^\\s*' + match[1] + '.([a-z]+)\\s*\\(');
        var cds = [];
        for (var i = 0, j = codes.length - 1; i < j; i++) {
            line = codes.shift();
            match = assertCodeRegx.exec(line);
            if (match) {
                cds.push({ tag: "assert", attrs: as.shift() });
            }
            else {
                cds.push(line.replace(rtrimRegx, ''));
            }
        }
        return cds;
    }
    var Namespace = /** @class */ (function () {
        function Namespace(name) {
            this.tag = "namespace";
            this.attrs = { 'name': name };
        }
        Namespace.prototype.find = function (subname) {
            var _a;
            var arr = this.children;
            if (arr)
                for (var i = 0, j = arr.length; i < j; i++)
                    if (((_a = arr[i].attrs) === null || _a === void 0 ? void 0 : _a.name) === subname)
                        return arr[i];
        };
        Namespace.prototype.sub = function (subname) {
            var sub = this.find(subname);
            if (!sub) {
                (this.children || (this.children = [])).push(sub = new Namespace(subname));
            }
            return sub;
        };
        Namespace.prototype.test = function (name, des, fn) {
            if (!fn) {
                if (typeof des === 'function') {
                    fn = des;
                    des = undefined;
                }
            }
            var assert = new Assert();
            if (Unittest._auto !== undefined) {
                Unittest._auto = 1;
                Unittest.auto();
            }
            fn(assert);
            var codes = makeCodes(fn, assert.results);
            (this.tests || (this.tests = [])).push({
                tag: 'test',
                attrs: { name: name, description: des },
                children: codes
            });
            return this;
        };
        return Namespace;
    }());
    var Unittest = /** @class */ (function () {
        function Unittest() {
        }
        Unittest.auto = function (auto) {
            var _this = this;
            if (auto !== false) {
                Unittest._auto = 1;
                if (!Unittest._autoTick) {
                    var render_1 = function () {
                        if (Unittest.rootNS) {
                            var dom = Unittest.render(Unittest.rootNS);
                            if (_this.render === DomRender) {
                                var body = Unittest.dom || document.body;
                                body.appendChild(dom);
                            }
                            Unittest.rootNS = null;
                            _this._auto = 1000;
                        }
                        else {
                            _this._auto += 100;
                            if (_this._auto > 1000 * 60 + 10) {
                                _this._auto = 0;
                            }
                            else
                                Unittest._autoTick = setTimeout(render_1, _this._auto);
                        }
                    };
                    Unittest._autoTick = setTimeout(render_1, this._auto);
                }
            }
            else {
                Unittest._auto = undefined;
                if (Unittest._autoTick) {
                    clearTimeout(Unittest._autoTick);
                    Unittest._autoTick = 0;
                }
            }
        };
        Unittest.namespace = function (name) {
            var ns = name.split('/');
            var nsNode = Unittest.rootNS || (Unittest.rootNS = new Namespace("#root"));
            for (var _i = 0, ns_1 = ns; _i < ns_1.length; _i++) {
                var v = ns_1[_i];
                nsNode = nsNode.sub(v);
            }
            return nsNode;
        };
        Unittest.render = function (node) {
            if (!node)
                node = Unittest.rootNS;
            console.group(node.attrs.name);
            if (node.tests) {
                for (var _i = 0, _a = node.tests; _i < _a.length; _i++) {
                    var test = _a[_i];
                    console.group(test.attrs.name);
                    for (var _b = 0, _c = test.children; _b < _c.length; _b++) {
                        var line = _c[_b];
                        if (typeof line === 'string')
                            console.log(line.replace(trimRegx, ''));
                        else {
                            var attrs = line.attrs;
                            if (attrs.assertValue) {
                                console.warn(attrs.message, attrs);
                            }
                            else {
                                console.error(attrs.message, attrs);
                            }
                        }
                    }
                    console.groupEnd();
                }
            }
            if (node.children) {
                for (var _d = 0, _e = node.children; _d < _e.length; _d++) {
                    var child = _e[_d];
                    Unittest.render(child);
                }
            }
            console.groupEnd();
        };
        return Unittest;
    }());
    exports.Unittest = Unittest;
    function DomRender(node) {
        if (!node)
            node = Unittest.rootNS;
        var nsDom = document.createElement('fieldset');
        nsDom.className = 'unittest';
        var caption = document.createElement("legend");
        nsDom.appendChild(caption);
        caption.innerHTML = node.attrs.name;
        if (node.tests) {
            var ul = document.createElement('ul');
            nsDom.appendChild(ul);
            ul.className = "tests";
            for (var _i = 0, _a = node.tests; _i < _a.length; _i++) {
                var test = _a[_i];
                var li = document.createElement("li");
                ul.appendChild(li);
                li.className = "test";
                var caption_1 = document.createElement("h4");
                li.appendChild(caption_1);
                caption_1.innerHTML = test.attrs.name;
                if (test.attrs.description) {
                    var des = document.createElement('pre');
                    li.appendChild(des);
                    des.className = 'description';
                    des.innerHTML = test.attrs.description;
                }
                if (test.children && test.children.length) {
                    var codeOL = document.createElement('ol');
                    li.appendChild(codeOL);
                    codeOL.className = "codes";
                    var preLi = void 0;
                    for (var _b = 0, _c = test.children; _b < _c.length; _b++) {
                        var line = _c[_b];
                        var li_1 = makeCodeLi(line);
                        if (li_1.tagName === 'PRE')
                            preLi.appendChild(li_1);
                        else if (li_1.tagName === "LI") {
                            codeOL.appendChild(preLi = li_1);
                        }
                    }
                    var clr = document.createElement("li");
                    codeOL.appendChild(clr);
                    clr.className = 'clr';
                    clr.style.cssText = "clear:both";
                }
            }
        }
        if (node.children) {
            for (var _d = 0, _e = node.children; _d < _e.length; _d++) {
                var child = _e[_d];
                var childDom = Unittest.render(child);
                nsDom.appendChild(childDom);
            }
        }
        return nsDom;
    }
    exports.DomRender = DomRender;
    function makeCodeLi(code) {
        if (typeof code === 'string') {
            var li = document.createElement('li');
            var lineDom = document.createElement("code");
            li.appendChild(lineDom);
            var codeDom = document.createElement("pre");
            lineDom.appendChild(codeDom);
            li.className = 'code-line';
            codeDom.innerHTML = code;
            return li;
        }
        else if (code.attrs.type === Assert.prototype.message) {
            var li = document.createElement('li');
            var preDom = document.createElement("div");
            li.appendChild(preDom);
            li.className = 'message';
            preDom.innerHTML = '\t/* ' + code.attrs.message + ' */';
            return li;
        }
        else {
            var attrs = code.attrs;
            var insDom = document.createElement("pre");
            insDom.innerHTML = "\t/* " + code.attrs.message + " */";
            if (attrs.assertValue) {
                insDom.className = 'success';
            }
            else {
                insDom.className = 'fail';
            }
            return insDom;
        }
    }
    Unittest.render = DomRender;
    Unittest.auto();
});
//# sourceMappingURL=unittest.js.map
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tokenRegx = /(?:\\\{)|(\{([^\{}]+)\})/gi;
    var Unittest = /** @class */ (function () {
        function Unittest() {
        }
        Unittest.replace = function (content, data) {
            if (content === null || content === undefined)
                return "";
            if (data)
                return content.toString().replace(tokenRegx, function (t, t0, tname) { return data[tname]; });
            return content.toString();
        };
        Unittest.prototype.group = function (name, testFn) {
            console.group(name);
            testFn(this);
            console.groupEnd();
            return this;
        };
        Unittest.prototype.message = function (content, data) {
            console.log(Unittest.replace(content, data));
            return this;
        };
        Unittest.prototype.eq = function (exepected, actual, message) {
            if (exepected !== actual)
                console.error(Unittest.replace(message || (message = "期望值{expected},实际值为{actual}"), { exepected: exepected, actual: actual }));
            else if (message)
                console.log(Unittest.replace(message, { exepected: exepected, actual: actual }));
            return this;
        };
        Unittest.prototype.true = function (value, message) {
            if (value !== true)
                console.error(message || (message = "期望为true"));
            else if (message)
                console.log(message);
            return this;
        };
        Unittest.prototype.false = function (value, message) {
            if (value !== false)
                console.error(message || (message = "期望为false"));
            else if (message)
                console.log(message);
            return this;
        };
        Unittest.group = function (name, fn) {
            return Unittest.instance.group(name, fn);
        };
        Unittest.instance = new Unittest();
        return Unittest;
    }());
    exports.Unittest = Unittest;
});
//# sourceMappingURL=unittest.js.map
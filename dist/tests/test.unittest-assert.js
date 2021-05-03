define(["require", "exports", "../unittest"], function (require, exports, unittest_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    unittest_1.Unittest.namespace("abc").test("string", function (ast) {
        ast.message('数组是否包含某元素');
        var obj = "abc";
        ast.equal("abc", obj, "等于");
        var rs = obj.indexOf('b') == 1;
        ast.true(rs);
    });
    unittest_1.Unittest.render();
});
//# sourceMappingURL=test.unittest-assert.js.map
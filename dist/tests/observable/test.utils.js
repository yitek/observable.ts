define(["require", "exports", "../../unittest", "../../observable"], function (require, exports, unittest_1, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    unittest_1.Unittest.group('is_array', function (ast) {
        ast.message('判断是否是数组');
        var rs = utils.is_array(undefined);
        ast.false(rs);
        rs = utils.is_array('');
        ast.false(rs);
        rs = utils.is_array([]);
        ast.true(rs);
    });
    unittest_1.Unittest.group('array_contains', function (ast) {
        ast.message('数组是否包含某元素');
        var obj = {};
        var arr = [1, '2', 1, obj];
        var rs = utils.array_contains(arr, 1);
        ast.true(rs);
        rs = utils.array_contains(arr, 2);
        ast.false(rs);
        rs = utils.array_contains(arr, obj);
        ast.true(rs);
        rs = utils.array_contains(arr, {});
        ast.false(rs);
    });
});
//# sourceMappingURL=test.utils.js.map
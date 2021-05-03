define(["require", "exports", "../../unittest", "../../observable"], function (require, exports, unittest_1, utils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    unittest_1.Unittest.namespace("observable").test('is_array', '判断是否是数组', function (ast) {
        ast.message('判断是否是数组');
        var rs = utils.is_array(undefined);
        ast.false(rs);
        rs = utils.is_array('');
        ast.false(rs);
        rs = utils.is_array([]);
        ast.true(rs);
    })
        .test('array_contains', '数组是否包含某元素', function (ast) {
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
    })
        .test('array_remove', '从数组中移除指定元素', function (ast) {
        var obj = {};
        var arr = [1, '2', 1, obj];
        var rs = utils.array_remove(arr, 1);
        ast.true(rs === 2 && arr[0] === '2' && arr[1] === obj, 'arr===[\'2\',obj],返回值rs==2');
        rs = utils.array_remove(arr, 2);
        ast.true(rs === 0 && arr[0] === '2' && arr[1] === obj, '返回值rs==0,表示未移除任何东西');
    });
});
//# sourceMappingURL=test.utils.js.map
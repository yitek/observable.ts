define(["require", "exports", "../../observable", "../../unittest"], function (require, exports, observable_1, unittest_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    unittest_1.Unittest.namespace("observable/valueObservable").test('basic', '基本操作', function (ast) {
        var ob = new observable_1.Observable(22);
        var evts = [];
        ob.$subscribe(function (e) { return evts.push(e); });
        var value = ob.$get();
        ast.equal(22, value, 'value===22');
        ob.$set('33');
        value = ob.$get();
        ast.true('33' === value && evts.length === 0, 'value===33,evts==[]');
        ob.$trigger();
        debugger;
        ast.compare({ value: '33', old: 22, sender: ob }, evts[0], 'evts[0] == { value: \'33\', old: 22, sender: ob }');
    });
});
//# sourceMappingURL=test.observableValue.js.map
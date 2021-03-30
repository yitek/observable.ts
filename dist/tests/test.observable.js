define(["require", "exports", "../observable"], function (require, exports, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var schema = new observable_1.Schema();
    schema.$define({
        pageIndex: 1,
        pageSize: 1,
        filters: {
            keyword: '',
            createTime_min: new Date(),
            createTime_max: new Date()
        },
        items: [
            {
                id: 1, name: ''
            }
        ]
    });
    console.log(schema);
});
//# sourceMappingURL=test.observable.js.map
define(["require", "exports", "../observable"], function (require, exports, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var schema = new observable_1.Schema();
    console.group('define');
    var tmpl = {
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
    };
    schema.$define(tmpl);
    console.log('shema.define', schema, tmpl);
    console.groupEnd();
    console.group('builder');
    schema = new observable_1.Schema(undefined, null);
    var modelBuilder = schema.$createBuilder();
    var filters = modelBuilder.filters;
    var keyword = filters.keyword;
    var pageIndex = modelBuilder.pageIndex;
    var itemName = modelBuilder.items[0].name;
    var name;
    for (var n in filters)
        name = n;
    console.log("schema:", schema);
    console.log("keyword:", keyword['$__observable.target__']);
    console.log("itemName", itemName['$__observable.target__']);
    console.log("pageIndex", pageIndex['$__observable.target__']);
    console.log("name", name);
    console.groupEnd();
});
//# sourceMappingURL=test.schema.js.map
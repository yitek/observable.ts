define(["require", "exports", "../../observable", "../../unittest"], function (require, exports, observable_1, unittest_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    unittest_1.Unittest.namespace("observable/schema").test('define', '定义数据架构', function (ast) {
        ast.message("\u65B0\u5EFA\u6570\u636E\u67B6\u6784\u5BF9\u8C61\n\u6570\u636E\u67B6\u6784\u5BF9\u8C61\u63CF\u8FF0\u4E86\u5BF9\u8C61\u7684\u5B57\u6BB5\u4E0E\u7C7B\u578B");
        var schema = new observable_1.Schema();
        ast.message("\u5B9A\u4E49\u6A21\u677F\u6570\u636E\n\u8BE5\u6570\u636E\u7ED3\u6784\u4E3A\u5178\u578B\u7684search\u9875\u9762\u7684\u6A21\u578B\u7ED3\u6784\n\u540E\u9762\u7684$define\u5C06\u6839\u636E\u8BE5\u6570\u636E\u7ED3\u6784\u6784\u5EFA\u6570\u636E\u67B6\u6784\u6570\u636E");
        var tplData = {
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
        ast.message("schema\u521B\u5EFA\u540E\u9ED8\u8BA4\u4E3Avalue\u7C7B\u578B\uFF0C\u6CA1\u6709\u4E0B\u7EA7\u6210\u5458\u63CF\u8FF0\uFF0C\u7528$define\u6307\u5B9A\u8BE5schema\u7684\u6570\u636E\u7ED3\u6784");
        schema.$define(tplData);
        ast.message("\u68C0\u6D4Bschema\u672C\u8EAB\u7684\u5C5E\u6027\u53D8\u66F4\u4E0E\u5176\u4E0A\u7684\u5B57\u6BB5\u63CF\u8FF0");
        var otype = schema.$type;
        ast.true(otype === observable_1.ObservableTypes.object, "schema的类型为对象otype==ObservableTypes.object");
        otype = schema.pageIndex.$type;
        ast.true(otype === observable_1.ObservableTypes.value, "schema上存在pageIndex成员的描述信息");
        otype = schema.filters.$type;
        ast.true(otype === observable_1.ObservableTypes.object, "schema上存在filters成员的描述信息,且类型为otype==object");
        otype = schema.items.$type;
        ast.true(otype === observable_1.ObservableTypes.array, "schema上存在items成员的描述信息,且类型为otype==array");
        // for schema只能出现tplData的成员名
        var propNames = [];
        for (var n in schema)
            propNames.push(n);
        ast.compare(['pageIndex', 'pageSize', 'filters', 'items'], propNames, "propNames==['pageIndex','pageSize','filters','items']");
        ast.message('进一步检测filters成员描述上的成员描述');
        otype = schema.filters.keyword.$type;
        ast.true(otype === observable_1.ObservableTypes.value, "schema.filters上存在keyword成员的描述信息,且类型为otype==value");
        propNames = [];
        for (var n in schema.filters)
            propNames.push(n);
        ast.compare(['keyword', 'createTime_min', 'createTime_max'], propNames, "propNames==['keyword','createTime_min','createTime_max']");
        ast.message('检测数组结构');
        otype = schema.items.$item.$type;
        ast.true(otype === observable_1.ObservableTypes.object, "schema.items上有数组元素描述($item)otype==object");
        otype = schema.items.$item.id.$type;
        ast.true(otype === observable_1.ObservableTypes.value, "可以从数组元素描述中获取到元素的id字段描述otype==value");
        propNames = [];
        for (var n in schema.item)
            propNames.push(n);
        ast.true(propNames.length === 0, "数组本身没有成员propNames=[]");
        propNames = [];
        for (var n in schema.items.$item)
            propNames.push(n);
        ast.compare(['id', 'name'], propNames, "propNames==['id','name']");
    }).test('build', '通过访问构建数据结构', function (ast) {
        var schema = new observable_1.Schema();
        schema = new observable_1.Schema(undefined, null);
        ast.message("\u4EA7\u751F\u521B\u5EFA\u5668");
        var modelBuilder = schema.$createBuilder();
        ast.message("\u8BBF\u95EEfilters\uFF0C\u4EA7\u751Ffilters\u5C5E\u6027\u63CF\u8FF0\u5BF9\u8C61");
        var filters = modelBuilder.filters;
        ast.equal(observable_1.Schema.fromBuilder(filters), schema.filters, '产生了schema.filters');
        ast.message("\u5728filters\u4E0A\u9762\u8BBF\u95EE\u5C5E\u6027");
        // 访问keyword属性
        var keywordBldr = filters.keyword;
        var keyword = schema.filters.keyword;
        ast.equal(keywordBldr[observable_1.Schema.BUILDER_TARGET], keyword, '产生了schema.filters.keyword,keyword instanceof Schema===true');
        var otype = schema.filters.$type;
        ast.equal(observable_1.ObservableTypes.object, otype, '由于在filters上面做了属性访问，filters类型自动转换成object,otype===object');
        // 访问createTime_min属性
        var createTime_minBldr = modelBuilder.filters.createTime_min;
        var createTime = schema.filters.createTime_min;
        ast.equal(observable_1.Schema.fromBuilder(modelBuilder.filters.createTime_min), schema.filters.createTime_min, '产生了schema.filters.createTime_min,createTime_min==Schema.fromBuilder(createTime_minBldr)');
        ast.message('访问数组元素');
        var itemName = modelBuilder.items[0].name;
        otype = schema.items.$type;
        ast.equal(observable_1.ObservableTypes.array, otype, '由于在items上面做了数组访问，items类型自动转换成array');
        ast.equal(schema.items.$item.name, observable_1.Schema.fromBuilder(itemName), 'items的元素描述中有name成员的描述,Schema.fromBuilder(itemName)===schema.items.$item.name');
    });
});
//# sourceMappingURL=test.schema.js.map
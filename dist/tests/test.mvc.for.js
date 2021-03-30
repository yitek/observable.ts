define(["require", "exports", "../mvc"], function (require, exports, mvc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function view(states) {
        var item = mvc_1.variable('item');
        return mvc_1.virtualNode("div", null,
            mvc_1.virtualNode("select", { bind: states.gender },
                mvc_1.virtualNode("option", { for: { each: states.genders, as: item }, value: item.value }, item.text)));
    }
    debugger;
    var tmpl = new mvc_1.Template(view);
    var data = { gender: 'male', genders: [{ value: 1, text: 'male' }, { value: 2, text: 'female' }] };
    var mount = tmpl.render(data);
    mount(document.body);
});
//# sourceMappingURL=test.mvc.for.js.map
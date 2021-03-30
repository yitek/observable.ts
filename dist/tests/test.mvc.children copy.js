define(["require", "exports", "../mvc"], function (require, exports, mvc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function view(states) {
        function output(states) {
            states.output = undefined;
            states.output = JSON.stringify(states);
        }
        return mvc_1.virtualNode("fieldset", null,
            mvc_1.virtualNode("legend", null, states.title),
            mvc_1.virtualNode("div", null,
                mvc_1.virtualNode("div", null,
                    mvc_1.virtualNode("label", null, "name:"),
                    mvc_1.virtualNode("input", { type: "text", bind: states.data.name })),
                mvc_1.virtualNode("div", null,
                    mvc_1.virtualNode("label", null, "gender:"),
                    mvc_1.virtualNode("select", { bind: states.data.gender },
                        mvc_1.virtualNode("option", { value: "male" }, "male"),
                        mvc_1.virtualNode("option", { value: "female" }, "female"))),
                mvc_1.virtualNode("div", null,
                    mvc_1.virtualNode("input", { type: "button", value: "\u8F93\u51FA", onclick: output })),
                mvc_1.virtualNode("textarea", { cols: "80", rows: "40" }, states.output)));
    }
    debugger;
    var tmpl = new mvc_1.Template(view);
    var data = { title: "DETAILS", data: { name: 'yiy' } };
    var mount = tmpl.render(data);
    mount(document.body);
});
//# sourceMappingURL=test.mvc.children copy.js.map
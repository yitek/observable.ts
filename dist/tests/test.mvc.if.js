define(["require", "exports", "../mvc"], function (require, exports, mvc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function view(model) {
        function output(states) {
            states.output = undefined;
            states.output = JSON.stringify(states);
        }
        return mvc_1.virtualNode("div", null,
            mvc_1.virtualNode("select", { bind: model.visable },
                mvc_1.virtualNode("option", { value: "" }, "hide"),
                mvc_1.virtualNode("option", { value: "female" }, "show")),
            mvc_1.virtualNode("span", { if: model.visable }, "Hello~"));
    }
    debugger;
    var tmpl = new mvc_1.Template(view);
    var data = { title: "DETAILS", data: { name: 'yiy' } };
    var elem = tmpl.render(data);
    document.body.appendChild(elem);
});
//# sourceMappingURL=test.mvc.if.js.map
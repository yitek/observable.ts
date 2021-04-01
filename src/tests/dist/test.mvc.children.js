"use strict";
exports.__esModule = true;
var mvc_1 = require("../mvc");
function view(states) {
    function output(states) {
        states.output = undefined;
        states.output = JSON.stringify(states, null, '\t');
    }
    return React.createElement("fieldset", null,
        React.createElement("legend", null, states.title),
        React.createElement("div", null,
            React.createElement("div", null,
                React.createElement("label", null, "name:"),
                React.createElement("input", { type: "text", bind: states.data.name })),
            React.createElement("div", null,
                React.createElement("label", null, "gender:"),
                React.createElement("select", { bind: states.data.gender },
                    React.createElement("option", { value: "male" }, "male"),
                    React.createElement("option", { value: "female" }, "female"))),
            React.createElement("div", null,
                React.createElement("input", { type: "button", value: "\u8F93\u51FA", onclick: output })),
            React.createElement("pre", null, states.output)));
}
debugger;
var tmpl = new mvc_1.Template(view);
var data = { title: "DETAILS", data: { name: 'yiy' } };
var mount = tmpl.render(data);
mount(document.body);

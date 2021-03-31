"use strict";
exports.__esModule = true;
var mvc_1 = require("../mvc");
function view(states) {
    var i = 0;
    function append(states, elem) {
        states.genders.push({ text: 'secret' + i, value: 'secret' + i });
        i++;
    }
    function remove(states, elem) {
        states.genders.shift();
    }
    var item = mvc_1.variable('item');
    return React.createElement("div", null,
        React.createElement("select", { bind: states.gender },
            React.createElement("option", { "for": { each: states.genders, as: item }, value: item.value }, item.text)),
        React.createElement("button", { onclick: append }, "\u8FFD\u52A0"),
        React.createElement("button", { onclick: remove }, "\u5220\u9664"));
}
debugger;
var tmpl = new mvc_1.Template(view);
var data = { gender: 'male', genders: [{ value: 1, text: 'male' }, { value: 2, text: 'female' }] };
var mount = tmpl.render(data);
mount(document.body);

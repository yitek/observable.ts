define(["require", "exports", "../mvc"], function (require, exports, mvc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
        return mvc_1.virtualNode("div", null,
            mvc_1.virtualNode("select", { bind: states.gender },
                mvc_1.virtualNode("option", { for: { each: states.genders, as: item }, value: item.value }, item.text)),
            mvc_1.virtualNode("button", { onclick: append }, "\u8FFD\u52A0"),
            mvc_1.virtualNode("button", { onclick: remove }, "\u5220\u9664"));
    }
    debugger;
    var tmpl = new mvc_1.Template(view);
    var data = { gender: 'male', genders: [{ value: 1, text: 'male' }, { value: 2, text: 'female' }] };
    var mount = tmpl.render(data);
    mount(document.body);
});
//# sourceMappingURL=test.mvc.for.js.map
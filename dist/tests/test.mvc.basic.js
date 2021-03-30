define(["require", "exports", "../mvc"], function (require, exports, mvc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function view(states) {
        function onblur(states, elem) {
            states.name = elem.value;
            setTimeout(function () { return console.log('state is changed', data); }, 0);
        }
        return mvc_1.virtualNode("input", { value: states.name, onblur: onblur });
    }
    var tmpl = new mvc_1.Template(view);
    var data = { name: 'yiy' };
    var appendTo = tmpl.render(data);
    appendTo(document.body);
});
//# sourceMappingURL=test.mvc.basic.js.map
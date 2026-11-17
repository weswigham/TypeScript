//// [tests/cases/conformance/lint/rules/vars-on-top/varsOnTopCore.ts] ////

//// [input.ts]
import foo from "foo";
"directive";
var first;
export var second;
work();
var late;
function method() {
    "directive";
    let first;
    var second;
    if (first) { var nested; }
    for (var index = 0;;) {}
}
class Example { static { "not directive"; var late; } }

//// [input.ts]
import foo from "foo";
"directive";
var first;
export var second;
work();
var late;
function method() {
    "directive";
    let first;
    var second;
    if (first) { var nested; }
    for (var index = 0;;) {}
}
class Example { static { "not directive"; var late; } }

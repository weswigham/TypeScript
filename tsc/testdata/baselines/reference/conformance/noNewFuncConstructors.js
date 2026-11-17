//// [tests/cases/conformance/lint/rules/no-new-func/noNewFuncConstructors.ts] ////

//// [input.ts]
new Function("return 1");
Function("return 1");
(Function)("return 1");
Function?.("return 1");
Function.call(null, "return 1");
Function.apply(null, ["return 1"]);
Function.bind(null, "return 1")();
Function["call"](null, "return 1");
Function[`bind`](null, "return 1");
(Function?.call)(null, "return 1");
Function?.apply?.(null, ["return 1"]);
Function.toString();
Function[call]();
use(Function);
new Class(Function);
use(Function.bind);
new Function.call();
window.Function("return 1");
function local(Function) {
    new Function();
    Function();
    Function.call(null);
}
const named = function Function() {
    Function();
};
{
    class Function {}
    new Function();
}

//// [shadowed.ts]
export {};
Function();
function Function() {}

//// [input.ts]
new Function("return 1");
Function("return 1");
(Function)("return 1");
Function?.("return 1");
Function.call(null, "return 1");
Function.apply(null, ["return 1"]);
Function.bind(null, "return 1")();
Function["call"](null, "return 1");
Function[`bind`](null, "return 1");
(Function?.call)(null, "return 1");
Function?.apply?.(null, ["return 1"]);
Function.toString();
Function[call]();
use(Function);
new Class(Function);
use(Function.bind);
new Function.call();
window.Function("return 1");
function local(Function) {
    new Function();
    Function();
    Function.call(null);
}
const named = function Function() {
    Function();
};
{
    class Function {}
    new Function();
}
//// [shadowed.ts]
export {};
Function();
function Function() {}

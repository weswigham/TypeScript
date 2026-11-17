//// [tests/cases/conformance/lint/rules/no-use-before-define/rolloutNoUseBeforeDefine.ts] ////

//// [input.ts]
called();
function called() {}
const recursive = () => recursive;
const immediate = (() => immediate)();
class C extends C {}
class D {
    [D]() {}
    static field = later;
    instance = later;
}
let later;
for (let item of item) {}

//// [input.ts]
called();
function called() {}
const recursive = () => recursive;
const immediate = (() => immediate)();
class C extends C {}
class D {
    [D]() {}
    static field = later;
    instance = later;
}
let later;
for (let item of item) {}

//// [tests/cases/conformance/lint/rules/no-object-constructor/noObjectConstructorScopeB.ts] ////

//// [input.ts]
Object();
const object = new Object;
const callback = () => Object?.();
Object(value);
new globalThis.Object();
function shadow(Object) { Object(); }

//// [input.ts]
Object();
const object = new Object;
const callback = () => Object?.();
Object(value);
new globalThis.Object();
function shadow(Object) { Object(); }

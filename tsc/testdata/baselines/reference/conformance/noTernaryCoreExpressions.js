//// [tests/cases/conformance/lint/rules/no-ternary/noTernaryCoreExpressions.ts] ////

//// [input.ts]
const foo = true ? thing : stuff;
true ? thing() : stuff();
function foo(bar) { return bar ? baz : qux; }
"x ? y";

//// [input.ts]
const foo = true ? thing : stuff;
true ? thing() : stuff();
function foo(bar) { return bar ? baz : qux; }
"x ? y";

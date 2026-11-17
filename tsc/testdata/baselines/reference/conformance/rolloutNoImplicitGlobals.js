//// [tests/cases/conformance/lint/rules/no-implicit-globals/rolloutNoImplicitGlobals.ts] ////

//// [input.ts]
var globalVariable;
let lexical;
class GlobalClass {}
function globalFunction() {
    var local;
    leaked = 1;
}
{ var hoisted; let blockLocal; }
for (otherLeak of values) {}

//// [input.ts]
var globalVariable;
let lexical;
class GlobalClass {}
function globalFunction() {
    var local;
    leaked = 1;
}
{ var hoisted; let blockLocal; }
for (otherLeak of values) {}

//// [tests/cases/conformance/lint/rules/max-nested-callbacks/maxNestedCallbacksCore.ts] ////

//// [input.ts]
call(() => { call(() => 1); });
new Example(() => { new Example(() => 1); });
call(function first() { function ordinary() {} });
(() => { (() => 1)(); })();

//// [input.ts]
call(() => { call(() => 1); });
new Example(() => { new Example(() => 1); });
call(function first() { function ordinary() {} });
(() => { (() => 1)(); })();

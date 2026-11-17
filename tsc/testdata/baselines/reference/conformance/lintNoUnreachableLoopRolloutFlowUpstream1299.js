//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1299.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: return; } } }

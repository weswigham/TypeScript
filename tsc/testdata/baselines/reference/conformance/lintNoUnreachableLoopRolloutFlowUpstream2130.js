//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2130.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: something(); default: return; } } }

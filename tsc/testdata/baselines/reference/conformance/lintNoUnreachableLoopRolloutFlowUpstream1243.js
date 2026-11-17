//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1243.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a of f(b)) { switch (foo) { case 1: return; } } }

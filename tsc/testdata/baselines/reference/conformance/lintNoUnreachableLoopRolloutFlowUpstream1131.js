//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1131.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a in f(b)) { switch (foo) { case 1: return; } } }

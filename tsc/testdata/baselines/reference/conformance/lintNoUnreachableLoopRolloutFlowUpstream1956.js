//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1956.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a in f(b)) { switch (foo) { case 1: something(); default: return; } } }

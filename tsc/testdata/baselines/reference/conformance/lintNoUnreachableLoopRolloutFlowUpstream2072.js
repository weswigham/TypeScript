//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2072.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a of f(b)) { switch (foo) { case 1: something(); default: return; } } }

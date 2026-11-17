//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2043.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: something(); default: return; } } }

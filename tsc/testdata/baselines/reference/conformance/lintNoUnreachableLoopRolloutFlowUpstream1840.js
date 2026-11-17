//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1840.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: something(); default: return; } } }

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: something(); default: return; } } }

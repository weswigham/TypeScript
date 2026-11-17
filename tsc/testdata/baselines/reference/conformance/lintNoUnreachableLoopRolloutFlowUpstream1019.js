//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1019.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: return; } } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1047.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { switch (foo) { case 1: return; } } }

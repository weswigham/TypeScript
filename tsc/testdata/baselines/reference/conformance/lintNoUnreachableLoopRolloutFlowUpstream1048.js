//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1048.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { switch (foo) { case 1: break; default: return; } } }

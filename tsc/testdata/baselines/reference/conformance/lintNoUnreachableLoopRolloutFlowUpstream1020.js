//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1020.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (a; ;) { switch (foo) { case 1: break; default: return; } } }

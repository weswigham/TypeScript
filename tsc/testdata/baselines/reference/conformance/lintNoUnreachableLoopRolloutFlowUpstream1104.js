//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1104.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (a in b) { switch (foo) { case 1: break; default: return; } } }

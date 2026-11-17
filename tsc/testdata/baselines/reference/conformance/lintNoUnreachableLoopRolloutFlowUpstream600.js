//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream600.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: break; default: return; } } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1160.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: break; default: return; } } }

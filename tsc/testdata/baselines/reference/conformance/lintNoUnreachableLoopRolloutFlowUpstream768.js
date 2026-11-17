//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream768.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { switch (foo) { case 1: break; default: return; } } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream936.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: break; default: return; } } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream935.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (; ; c++) { switch (foo) { case 1: return; } } }

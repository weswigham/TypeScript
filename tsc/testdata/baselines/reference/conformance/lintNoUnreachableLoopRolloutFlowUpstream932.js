//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream932.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (; ; c++) { if (foo) { return; } bar(); } }

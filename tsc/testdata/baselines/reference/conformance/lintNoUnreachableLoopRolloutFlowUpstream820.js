//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream820.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { return; } bar(); } }

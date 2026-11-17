//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream822.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { continue; } return; } }

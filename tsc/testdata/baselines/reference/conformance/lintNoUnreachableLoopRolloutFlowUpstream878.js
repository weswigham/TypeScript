//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream878.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { continue; } return; } }

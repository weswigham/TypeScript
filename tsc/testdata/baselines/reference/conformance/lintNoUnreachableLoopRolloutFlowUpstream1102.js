//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1102.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { continue; } return; } }

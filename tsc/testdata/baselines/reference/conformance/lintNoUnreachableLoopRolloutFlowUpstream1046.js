//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1046.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { continue; } return; } }

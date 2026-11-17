//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1214.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { continue; } return; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1018.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { continue; } return; } }

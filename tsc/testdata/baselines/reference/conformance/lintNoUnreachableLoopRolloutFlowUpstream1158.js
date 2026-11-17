//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1158.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { continue; } return; } }

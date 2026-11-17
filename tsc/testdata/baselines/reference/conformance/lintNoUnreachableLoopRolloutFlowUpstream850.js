//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream850.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { continue; } return; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream682.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { continue; } return; } }

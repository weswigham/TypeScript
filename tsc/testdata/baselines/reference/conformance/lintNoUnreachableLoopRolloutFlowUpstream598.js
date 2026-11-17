//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream598.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { continue; } return; } }

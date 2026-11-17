//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream570.ts] ////

//// [input.ts]
function someFunc() { while (a) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { while (a) { if (foo) { continue; } return; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1270.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { continue; } return; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream906.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { continue; } return; } }

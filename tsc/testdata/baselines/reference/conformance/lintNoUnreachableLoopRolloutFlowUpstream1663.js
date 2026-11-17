//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1663.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { return; } throw err; } }

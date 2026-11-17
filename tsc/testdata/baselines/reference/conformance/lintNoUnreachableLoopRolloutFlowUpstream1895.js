//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1895.ts] ////

//// [input.ts]
function someFunc() { for (;;) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (;;) { if (foo) { return; } throw err; } }

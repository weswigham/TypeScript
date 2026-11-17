//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1837.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { return; } throw err; } }

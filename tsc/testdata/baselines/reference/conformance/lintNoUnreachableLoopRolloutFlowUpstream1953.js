//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1953.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { return; } throw err; } }

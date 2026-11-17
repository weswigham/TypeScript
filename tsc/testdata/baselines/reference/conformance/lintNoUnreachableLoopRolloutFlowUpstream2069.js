//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2069.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { return; } throw err; } }

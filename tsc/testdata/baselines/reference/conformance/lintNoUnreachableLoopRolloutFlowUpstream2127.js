//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2127.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { if (foo) { return; } throw err; } }

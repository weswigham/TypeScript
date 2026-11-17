//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1518.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { return; } throw err; } }

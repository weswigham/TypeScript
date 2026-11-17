//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream708.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { return; } bar(); } }

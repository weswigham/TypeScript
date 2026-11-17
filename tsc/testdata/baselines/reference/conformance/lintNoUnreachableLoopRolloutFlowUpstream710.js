//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream710.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { continue; } return; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1517.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { if (foo) { return; } else { break; } bar(); } }

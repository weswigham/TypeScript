//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1511.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { return; } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { return; } }

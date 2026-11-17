//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream711.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { switch (foo) { case 1: return; } } }

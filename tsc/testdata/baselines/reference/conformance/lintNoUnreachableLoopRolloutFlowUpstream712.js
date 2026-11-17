//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream712.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { switch (foo) { case 1: break; default: return; } } }

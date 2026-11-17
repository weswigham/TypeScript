//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream713.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { switch (foo) { case 1: continue; default: return; } throw err; } }

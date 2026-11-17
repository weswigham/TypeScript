//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1301.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1300.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { switch (foo) { case 1: break; default: return; } } }

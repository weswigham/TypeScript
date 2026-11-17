//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1188.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { switch (foo) { case 1: break; default: return; } } }

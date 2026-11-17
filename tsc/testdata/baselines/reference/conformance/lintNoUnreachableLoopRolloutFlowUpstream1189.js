//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1189.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { switch (foo) { case 1: continue; default: return; } throw err; } }

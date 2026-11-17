//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1984.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: throw err; default: return; } } }

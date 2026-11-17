//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1665.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (a; b;) { switch (foo) { case 1: throw err; default: return; } } }

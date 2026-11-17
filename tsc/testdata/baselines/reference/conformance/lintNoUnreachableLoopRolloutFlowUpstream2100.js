//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2100.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: throw err; default: return; } } }

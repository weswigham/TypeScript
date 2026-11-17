//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1810.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { switch (foo) { case 1: throw err; default: return; } } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1549.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: throw err; default: return; } } }

//// [input.ts]
function someFunc() { for (; b; c) { switch (foo) { case 1: throw err; default: return; } } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2098.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { return; } throw err; } }

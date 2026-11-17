//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2091.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { return; } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { return; } }

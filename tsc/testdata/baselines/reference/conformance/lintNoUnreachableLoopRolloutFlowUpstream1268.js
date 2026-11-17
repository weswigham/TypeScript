//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1268.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { return; } bar(); } }

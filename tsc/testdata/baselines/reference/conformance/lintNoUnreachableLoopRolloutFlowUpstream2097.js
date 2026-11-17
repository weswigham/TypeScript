//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2097.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { if (foo) { return; } else { break; } bar(); } }

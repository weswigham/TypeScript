//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2068.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { return; } else { break; } bar(); } }

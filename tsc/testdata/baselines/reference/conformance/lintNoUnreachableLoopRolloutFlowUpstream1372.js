//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1372.ts] ////

//// [input.ts]
function someFunc() { while (a) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { while (a) { if (foo) { return; } else { break; } bar(); } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1952.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { return; } else { break; } bar(); } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1130.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { continue; } return; } }

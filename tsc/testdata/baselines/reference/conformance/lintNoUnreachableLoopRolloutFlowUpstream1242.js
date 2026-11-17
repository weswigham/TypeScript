//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1242.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { continue; } return; } }

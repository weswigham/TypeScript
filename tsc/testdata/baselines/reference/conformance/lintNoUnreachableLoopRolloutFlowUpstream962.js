//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream962.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { continue; } return; } }

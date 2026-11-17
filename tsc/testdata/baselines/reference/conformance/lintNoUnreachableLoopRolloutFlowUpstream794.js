//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream794.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { continue; } return; } }

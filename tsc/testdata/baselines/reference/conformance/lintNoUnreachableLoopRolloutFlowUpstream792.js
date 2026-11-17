//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream792.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { return; } bar(); } }

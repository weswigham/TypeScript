//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1547.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { return; } throw err; } }

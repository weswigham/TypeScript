//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1721.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { return; } throw err; } }

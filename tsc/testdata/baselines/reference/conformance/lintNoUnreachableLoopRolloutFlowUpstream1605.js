//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1605.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { return; } throw err; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1982.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { return; } throw err; } }

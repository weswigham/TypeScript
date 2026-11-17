//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1103.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a in b) { switch (foo) { case 1: return; } } }

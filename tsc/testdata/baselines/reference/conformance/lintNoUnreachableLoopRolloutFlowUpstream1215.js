//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1215.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a of b) { switch (foo) { case 1: return; } } }

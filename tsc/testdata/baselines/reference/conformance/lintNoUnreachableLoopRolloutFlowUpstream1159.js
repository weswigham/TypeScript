//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1159.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (var a in b) { switch (foo) { case 1: return; } } }

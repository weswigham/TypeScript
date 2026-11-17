//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1271.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for ({ a, b } of c) { switch (foo) { case 1: return; } } }

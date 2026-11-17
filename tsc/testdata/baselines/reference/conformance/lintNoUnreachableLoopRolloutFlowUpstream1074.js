//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1074.ts] ////

//// [input.ts]
function someFunc() { for (;;) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (;;) { if (foo) { continue; } return; } }

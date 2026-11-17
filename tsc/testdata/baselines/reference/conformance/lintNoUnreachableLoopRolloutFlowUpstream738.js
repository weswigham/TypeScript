//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream738.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { continue; } return; } }

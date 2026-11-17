//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1981.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { return; } else { break; } bar(); } }

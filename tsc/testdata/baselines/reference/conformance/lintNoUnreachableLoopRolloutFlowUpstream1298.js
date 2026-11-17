//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1298.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { if (foo) { continue; } return; } }

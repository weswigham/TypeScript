//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2126.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { if (foo) { return; } else { break; } bar(); } }

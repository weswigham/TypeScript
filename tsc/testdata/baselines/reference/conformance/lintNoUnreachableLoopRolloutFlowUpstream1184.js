//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1184.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { return; } bar(); } }

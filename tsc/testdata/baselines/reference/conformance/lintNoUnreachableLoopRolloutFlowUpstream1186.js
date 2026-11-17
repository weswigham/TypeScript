//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1186.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { if (foo) { continue; } return; } }

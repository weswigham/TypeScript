//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2096.ts] ////

//// [input.ts]
function someFunc() { for ({ a, b } of c) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for ({ a, b } of c) if (foo) break; else return; }

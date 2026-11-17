//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1203.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (let a in f(b)) while (foo) if (bar) return; }

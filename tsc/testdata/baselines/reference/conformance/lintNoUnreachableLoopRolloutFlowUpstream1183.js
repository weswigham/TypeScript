//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1183.ts] ////

//// [input.ts]
for (let a in f(b)) { if (foo) break; }

//// [input.ts]
for (let a in f(b)) { if (foo) break; }

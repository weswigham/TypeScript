//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1204.ts] ////

//// [input.ts]
for (let a in f(b)) for (a in b);

//// [input.ts]
for (let a in f(b)) for (a in b);

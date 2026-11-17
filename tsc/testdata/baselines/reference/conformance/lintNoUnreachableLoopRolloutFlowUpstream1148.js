//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1148.ts] ////

//// [input.ts]
for (a in f(b)) for (a in b);

//// [input.ts]
for (a in f(b)) for (a in b);

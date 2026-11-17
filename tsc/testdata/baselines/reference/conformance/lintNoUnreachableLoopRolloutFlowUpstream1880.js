//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1880.ts] ////

//// [input.ts]
for (a = 0; ;) { for (a in b); break; }

//// [input.ts]
for (a = 0; ;) { for (a in b); break; }

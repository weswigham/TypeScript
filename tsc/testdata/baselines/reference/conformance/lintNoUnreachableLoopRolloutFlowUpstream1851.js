//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1851.ts] ////

//// [input.ts]
for (a; ;) { for (a in b); break; }

//// [input.ts]
for (a; ;) { for (a in b); break; }

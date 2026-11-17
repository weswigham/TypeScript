//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1938.ts] ////

//// [input.ts]
for (a in b) { for (a in b); break; }

//// [input.ts]
for (a in b) { for (a in b); break; }

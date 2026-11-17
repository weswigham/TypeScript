//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1939.ts] ////

//// [input.ts]
for (a in b) { for (a of b); break; }

//// [input.ts]
for (a in b) { for (a of b); break; }

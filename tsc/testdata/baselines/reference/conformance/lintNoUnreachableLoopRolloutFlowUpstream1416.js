//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1416.ts] ////

//// [input.ts]
while (a && b) { for (a in b); break; }

//// [input.ts]
while (a && b) { for (a in b); break; }

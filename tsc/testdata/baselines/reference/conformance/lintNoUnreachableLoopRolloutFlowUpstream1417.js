//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1417.ts] ////

//// [input.ts]
while (a && b) { for (a of b); break; }

//// [input.ts]
while (a && b) { for (a of b); break; }

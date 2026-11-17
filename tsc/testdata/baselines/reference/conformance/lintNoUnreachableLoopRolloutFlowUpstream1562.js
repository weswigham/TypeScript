//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1562.ts] ////

//// [input.ts]
for (; b; c) { for (a of b); break; }

//// [input.ts]
for (; b; c) { for (a of b); break; }

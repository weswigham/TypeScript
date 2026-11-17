//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1557.ts] ////

//// [input.ts]
for (; b; c) { for (a; b; c); break; }

//// [input.ts]
for (; b; c) { for (a; b; c); break; }

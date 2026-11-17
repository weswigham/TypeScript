//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1847.ts] ////

//// [input.ts]
for (a; ;) { for (a; b; c); break; }

//// [input.ts]
for (a; ;) { for (a; b; c); break; }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1852.ts] ////

//// [input.ts]
for (a; ;) { for (a of b); break; }

//// [input.ts]
for (a; ;) { for (a of b); break; }

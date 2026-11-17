//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1934.ts] ////

//// [input.ts]
for (a in b) { for (a; b; c); break; }

//// [input.ts]
for (a in b) { for (a; b; c); break; }

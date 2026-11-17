//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1503.ts] ////

//// [input.ts]
for (a; b; c) { for (a in b); break; }

//// [input.ts]
for (a; b; c) { for (a in b); break; }

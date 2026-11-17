//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1504.ts] ////

//// [input.ts]
for (a; b; c) { for (a of b); break; }

//// [input.ts]
for (a; b; c) { for (a of b); break; }

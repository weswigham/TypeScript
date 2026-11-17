//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1678.ts] ////

//// [input.ts]
for (a; b;) { for (a of b); break; }

//// [input.ts]
for (a; b;) { for (a of b); break; }

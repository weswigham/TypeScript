//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1676.ts] ////

//// [input.ts]
for (a; b;) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a; b;) { for(;;) if (foo) break; break; }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2190.ts] ////

//// [input.ts]
for (a in b) break; for (;;) break; for (c of d) break;

//// [input.ts]
for (a in b) break; for (;;) break; for (c of d) break;

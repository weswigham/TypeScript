//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1117.ts] ////

//// [input.ts]
for (a in b) for (;;) if (foo) break;

//// [input.ts]
for (a in b) for (;;) if (foo) break;

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1618.ts] ////

//// [input.ts]
for (a; ; c) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a; ; c) { for(;;) if (foo) break; break; }

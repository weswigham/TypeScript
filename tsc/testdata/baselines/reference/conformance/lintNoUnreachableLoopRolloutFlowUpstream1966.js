//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1966.ts] ////

//// [input.ts]
for (a in f(b)) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a in f(b)) { for(;;) if (foo) break; break; }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2111.ts] ////

//// [input.ts]
for ({ a, b } of c) { for(;;) if (foo) break; break; }

//// [input.ts]
for ({ a, b } of c) { for(;;) if (foo) break; break; }

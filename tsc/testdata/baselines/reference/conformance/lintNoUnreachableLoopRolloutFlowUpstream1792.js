//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1792.ts] ////

//// [input.ts]
for (; b;) { for(;;) if (foo) break; break; }

//// [input.ts]
for (; b;) { for(;;) if (foo) break; break; }

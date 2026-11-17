//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1995.ts] ////

//// [input.ts]
for (var a in b) { for(;;) if (foo) break; break; }

//// [input.ts]
for (var a in b) { for(;;) if (foo) break; break; }

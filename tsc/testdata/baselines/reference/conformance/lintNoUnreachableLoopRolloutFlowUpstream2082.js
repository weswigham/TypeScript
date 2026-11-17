//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2082.ts] ////

//// [input.ts]
for (a of f(b)) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a of f(b)) { for(;;) if (foo) break; break; }

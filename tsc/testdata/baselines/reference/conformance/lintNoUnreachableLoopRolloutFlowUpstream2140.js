//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2140.ts] ////

//// [input.ts]
for (var a of f(b)) { for(;;) if (foo) break; break; }

//// [input.ts]
for (var a of f(b)) { for(;;) if (foo) break; break; }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2050.ts] ////

//// [input.ts]
for (a of b) { for (a; b; c); break; }

//// [input.ts]
for (a of b) { for (a; b; c); break; }

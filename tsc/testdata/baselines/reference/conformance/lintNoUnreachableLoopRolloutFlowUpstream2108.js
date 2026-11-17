//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2108.ts] ////

//// [input.ts]
for ({ a, b } of c) { for (a; b; c); break; }

//// [input.ts]
for ({ a, b } of c) { for (a; b; c); break; }

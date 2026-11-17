//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2113.ts] ////

//// [input.ts]
for ({ a, b } of c) { for (a of b); break; }

//// [input.ts]
for ({ a, b } of c) { for (a of b); break; }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2112.ts] ////

//// [input.ts]
for ({ a, b } of c) { for (a in b); break; }

//// [input.ts]
for ({ a, b } of c) { for (a in b); break; }

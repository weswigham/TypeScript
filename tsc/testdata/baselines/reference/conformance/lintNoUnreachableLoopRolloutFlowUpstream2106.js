//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2106.ts] ////

//// [input.ts]
for ({ a, b } of c) { while (a); break; }

//// [input.ts]
for ({ a, b } of c) { while (a); break; }

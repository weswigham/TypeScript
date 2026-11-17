//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2109.ts] ////

//// [input.ts]
for ({ a, b } of c) { for (; b;); break; }

//// [input.ts]
for ({ a, b } of c) { for (; b;); break; }

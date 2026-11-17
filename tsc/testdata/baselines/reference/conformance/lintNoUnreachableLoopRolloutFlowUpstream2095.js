//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2095.ts] ////

//// [input.ts]
for ({ a, b } of c) { break; foo(); }

//// [input.ts]
for ({ a, b } of c) { break; foo(); }

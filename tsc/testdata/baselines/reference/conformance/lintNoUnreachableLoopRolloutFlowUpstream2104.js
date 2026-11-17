//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2104.ts] ////

//// [input.ts]
for ({ a, b } of c) { () => a; break; }

//// [input.ts]
for ({ a, b } of c) { () => a; break; }

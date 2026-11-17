//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1269.ts] ////

//// [input.ts]
for ({ a, b } of c) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for ({ a, b } of c) { if (foo) { bar(); } else { break; } }

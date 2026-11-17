//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream737.ts] ////

//// [input.ts]
for (; b; c) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (; b; c) { if (foo) { bar(); } else { break; } }

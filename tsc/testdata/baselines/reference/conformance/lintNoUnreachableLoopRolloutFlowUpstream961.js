//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream961.ts] ////

//// [input.ts]
for (; b;) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (; b;) { if (foo) { bar(); } else { break; } }

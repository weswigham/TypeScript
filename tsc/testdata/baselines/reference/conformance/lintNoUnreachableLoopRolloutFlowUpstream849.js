//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream849.ts] ////

//// [input.ts]
for (a; b;) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a; b;) { if (foo) { bar(); } else { break; } }

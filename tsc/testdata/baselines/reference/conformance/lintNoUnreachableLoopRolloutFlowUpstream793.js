//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream793.ts] ////

//// [input.ts]
for (a; ; c) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a; ; c) { if (foo) { bar(); } else { break; } }

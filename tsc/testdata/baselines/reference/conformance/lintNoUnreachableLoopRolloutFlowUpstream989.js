//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream989.ts] ////

//// [input.ts]
for (; b < foo; ) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (; b < foo; ) { if (foo) { bar(); } else { break; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1157.ts] ////

//// [input.ts]
for (var a in b) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (var a in b) { if (foo) { bar(); } else { break; } }

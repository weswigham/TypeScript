//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1241.ts] ////

//// [input.ts]
for (a of f(b)) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a of f(b)) { if (foo) { bar(); } else { break; } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1297.ts] ////

//// [input.ts]
for (var a of f(b)) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (var a of f(b)) { if (foo) { bar(); } else { break; } }

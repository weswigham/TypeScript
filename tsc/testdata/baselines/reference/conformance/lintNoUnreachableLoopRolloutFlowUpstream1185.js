//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1185.ts] ////

//// [input.ts]
for (let a in f(b)) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (let a in f(b)) { if (foo) { bar(); } else { break; } }

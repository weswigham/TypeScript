//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1198.ts] ////

//// [input.ts]
for (let a in f(b)) for (a; b; c);

//// [input.ts]
for (let a in f(b)) for (a; b; c);

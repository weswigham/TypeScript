//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1202.ts] ////

//// [input.ts]
for (let a in f(b)) while (true) if (foo) break;

//// [input.ts]
for (let a in f(b)) while (true) if (foo) break;

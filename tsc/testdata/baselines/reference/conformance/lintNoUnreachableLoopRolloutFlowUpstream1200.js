//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1200.ts] ////

//// [input.ts]
for (let a in f(b)) for (; ; c) if (foo) break;

//// [input.ts]
for (let a in f(b)) for (; ; c) if (foo) break;

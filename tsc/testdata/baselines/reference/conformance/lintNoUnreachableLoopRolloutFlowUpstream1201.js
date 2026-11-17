//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1201.ts] ////

//// [input.ts]
for (let a in f(b)) for (;;) if (foo) break;

//// [input.ts]
for (let a in f(b)) for (;;) if (foo) break;

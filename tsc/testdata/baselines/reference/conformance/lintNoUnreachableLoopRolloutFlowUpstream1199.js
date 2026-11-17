//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1199.ts] ////

//// [input.ts]
for (let a in f(b)) for (; b;);

//// [input.ts]
for (let a in f(b)) for (; b;);

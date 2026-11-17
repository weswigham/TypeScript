//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1790.ts] ////

//// [input.ts]
for (; b;) { for (; b;); break; }

//// [input.ts]
for (; b;) { for (; b;); break; }

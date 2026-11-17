//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2186.ts] ////

//// [input.ts]
while (a) break; do break; while (b); for (;;) break; for (c in d) break; for (e of f) break;

//// [input.ts]
while (a) break; do break; while (b); for (;;) break; for (c in d) break; for (e of f) break;

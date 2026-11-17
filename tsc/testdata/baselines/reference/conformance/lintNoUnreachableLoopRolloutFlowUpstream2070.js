//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2070.ts] ////

//// [input.ts]
for (a of f(b)) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a of f(b)) { switch (foo) { default: throw err; } }

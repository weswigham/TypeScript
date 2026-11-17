//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1693.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a = 0; b < foo; ) { switch (foo) { default: throw err; } }

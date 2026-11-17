//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1606.ts] ////

//// [input.ts]
for (a; ; c) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a; ; c) { switch (foo) { default: throw err; } }

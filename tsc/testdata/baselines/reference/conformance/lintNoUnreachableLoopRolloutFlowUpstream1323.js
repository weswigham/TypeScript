//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1323.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) break; } }

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) break; } }

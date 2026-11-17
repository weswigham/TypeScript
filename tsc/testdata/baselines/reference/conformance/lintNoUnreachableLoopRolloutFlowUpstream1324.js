//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1324.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { return; } bar(); } }

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { return; } bar(); } }

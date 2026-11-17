//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2155.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { return; } else { break; } bar(); } }

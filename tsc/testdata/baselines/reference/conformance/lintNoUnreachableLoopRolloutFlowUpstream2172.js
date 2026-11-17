//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2172.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) for (;;); }

//// [input.ts]
async function foo() { for await (const a of b) for (;;); }

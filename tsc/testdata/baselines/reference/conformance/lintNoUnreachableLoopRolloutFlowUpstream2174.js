//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2174.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) while (true); }

//// [input.ts]
async function foo() { for await (const a of b) while (true); }

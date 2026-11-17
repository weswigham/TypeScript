//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1339.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) for (; b;); }

//// [input.ts]
async function foo() { for await (const a of b) for (; b;); }

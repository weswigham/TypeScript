//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1344.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) for (a in b); }

//// [input.ts]
async function foo() { for await (const a of b) for (a in b); }

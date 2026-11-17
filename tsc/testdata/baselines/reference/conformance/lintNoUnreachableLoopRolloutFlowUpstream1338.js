//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1338.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) for (a; b; c); }

//// [input.ts]
async function foo() { for await (const a of b) for (a; b; c); }

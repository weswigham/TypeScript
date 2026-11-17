//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1336.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) while (a); }

//// [input.ts]
async function foo() { for await (const a of b) while (a); }

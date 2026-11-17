//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1340.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) for (; ; c) if (foo) break; }

//// [input.ts]
async function foo() { for await (const a of b) for (; ; c) if (foo) break; }

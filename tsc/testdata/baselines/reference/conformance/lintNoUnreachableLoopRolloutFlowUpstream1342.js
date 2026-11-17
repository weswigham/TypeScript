//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1342.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) while (true) if (foo) break; }

//// [input.ts]
async function foo() { for await (const a of b) while (true) if (foo) break; }

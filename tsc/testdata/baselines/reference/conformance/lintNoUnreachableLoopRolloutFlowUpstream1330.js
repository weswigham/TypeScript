//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1330.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { try { return bar(); } catch (e) {} } }

//// [input.ts]
async function foo() { for await (const a of b) { try { return bar(); } catch (e) {} } }

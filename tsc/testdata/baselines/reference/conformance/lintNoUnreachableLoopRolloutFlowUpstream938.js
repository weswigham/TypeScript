//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream938.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (; ; c++) { try { return bar(); } catch (e) {} } }

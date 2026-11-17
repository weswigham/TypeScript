//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream826.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { try { return bar(); } catch (e) {} } }

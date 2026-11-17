//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1022.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a; ;) { try { return bar(); } catch (e) {} } }

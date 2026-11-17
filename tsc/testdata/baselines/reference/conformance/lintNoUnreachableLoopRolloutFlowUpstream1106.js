//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1106.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a in b) { try { return bar(); } catch (e) {} } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1162.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (var a in b) { try { return bar(); } catch (e) {} } }

//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1302.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { try { return bar(); } catch (e) {} } }

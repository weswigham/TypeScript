//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2015.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { try { return bar(); } catch (e) { break; } } }

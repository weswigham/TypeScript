//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableESLintFlowBoundariesFunctionFClassCStaticThrowErrorWork.ts] ////

//// [input.ts]
function f() { class C { static { throw error; } } work(); }

//// [input.ts]
function f() { class C { static { throw error; } } work(); }

//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableESLintFlowBoundariesFunctionAbortNeverThrowErrorFunctionFAbortWork.ts] ////

//// [input.ts]
function abort(): never { throw Error(); } function f() { abort(); work(); }

//// [input.ts]
function abort(): never { throw Error(); } function f() { abort(); work(); }

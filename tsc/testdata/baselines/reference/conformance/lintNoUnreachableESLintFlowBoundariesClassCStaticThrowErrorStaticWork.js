//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableESLintFlowBoundariesClassCStaticThrowErrorStaticWork.ts] ////

//// [input.ts]
class C { static { throw error; } static { work(); } }

//// [input.ts]
class C { static { throw error; } static { work(); } }

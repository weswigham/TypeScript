//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersFunctionLocalTValueTConstOtherTValue.ts] ////

//// [input.ts]
function local<T>(value: T) { const other: T = value; }

//// [input.ts]
function local<T>(value: T) { const other: T = value; }

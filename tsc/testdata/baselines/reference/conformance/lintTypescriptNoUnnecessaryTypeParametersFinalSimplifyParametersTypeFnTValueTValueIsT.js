//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersTypeFnTValueTValueIsT.ts] ////

//// [input.ts]
type Fn = <T>(value: T) => value is T;

//// [input.ts]
type Fn = <T>(value: T) => value is T;

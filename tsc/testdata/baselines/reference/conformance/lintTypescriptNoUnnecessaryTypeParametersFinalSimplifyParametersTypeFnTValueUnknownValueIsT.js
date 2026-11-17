//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersTypeFnTValueUnknownValueIsT.ts] ////

//// [input.ts]
type Fn = <T>(value: unknown) => value is T;

//// [input.ts]
type Fn = <T>(value: unknown) => value is T;

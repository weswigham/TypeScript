//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersTypeFnTValueTKInKeyofTK.ts] ////

//// [input.ts]
type Fn = <T>(value: T) => { [K in keyof T]: K };

//// [input.ts]
type Fn = <T>(value: T) => { [K in keyof T]: K };

//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersTypeFnTKInKeyofTK.ts] ////

//// [input.ts]
type Fn = <T>() => { [K in keyof T]: K };

//// [input.ts]
type Fn = <T>() => { [K in keyof T]: K };

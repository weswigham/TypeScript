//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersDeclareFunctionRemapTExtendsStringValueTKInAAsT.ts] ////

//// [input.ts]
declare function remap<T extends string>(value: T): { [K in 'a' as T]: 0 }; function f<P extends string>(value: P) { return remap(value); }

//// [input.ts]
declare function remap<T extends string>(value: T): { [K in 'a' as T]: 0 }; function f<P extends string>(value: P) { return remap(value); }

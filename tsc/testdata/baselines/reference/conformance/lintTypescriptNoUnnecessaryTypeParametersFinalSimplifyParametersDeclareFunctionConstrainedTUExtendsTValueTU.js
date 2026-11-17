//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersDeclareFunctionConstrainedTUExtendsTValueTU.ts] ////

//// [input.ts]
declare function constrained<T, U extends T>(value: T): U;

//// [input.ts]
declare function constrained<T, U extends T>(value: T): U;

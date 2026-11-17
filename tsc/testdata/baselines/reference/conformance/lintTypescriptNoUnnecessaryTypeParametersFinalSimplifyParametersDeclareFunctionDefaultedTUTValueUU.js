//// [tests/cases/conformance/lint/rules/no-unnecessary-type-parameters/lintTypescriptNoUnnecessaryTypeParametersFinalSimplifyParametersDeclareFunctionDefaultedTUTValueUU.ts] ////

//// [input.ts]
declare function defaulted<T, U = T>(value: U): U;

//// [input.ts]
declare function defaulted<T, U = T>(value: U): U;
